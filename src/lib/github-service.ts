/**
 * Service d'Intégration Git & GitHub App
 * TABAYYUN — Gouvernance Scientifique & Workflow Git/PR
 *
 * Règle d'or :
 * AUCUNE écriture directe sur `main` ni en base de données pour les contenus publiés.
 * Toute proposition de modification passe obligatoirement par une branche dédiée et une Pull Request.
 */

import matter from "gray-matter";
import { LessonFrontmatterSchema } from "./schemas/lesson.schema";
import { InquirySchema } from "./schemas/inquiry.schema";
import {
  computeScientificDiff,
  validateChecklistAnswers,
  validateEditorialTransition,
  applyEvidenceInvalidation,
  applyInquiryEvidenceInvalidation,
  EditorialStatus,
  EvidenceRecord,
  InquiryEvidenceItem,
  DiffEntry,
} from "./scientific-governance";
import { getCanonicalScientificContentFromGitHub } from "./canonical-content";
import { getGitHubAuthHeader } from "./github-auth";
import { recordAuditEvent } from "./audit-logger";

export interface ProposalRequest {
  type: "lesson" | "inquiry";
  slug: string;
  originalContent?: Record<string, unknown>; // Ignoré par le serveur (chargement canonique strict depuis GitHub main)
  proposedContent: Record<string, unknown>;
  checklistAnswers: Record<string, boolean>;
  reviewerNotes?: string;
  userId: string;
  userEmail: string;
  baseFileSha: string; // OBLIGATOIRE (Invariant Stale-Edit)
}

export interface ProposalResult {
  success: boolean;
  branchName: string;
  pullRequestUrl: string;
  pullRequestNumber: number;
  diffs: DiffEntry[];
  invalidations: string[];
  isSimulated: boolean;
  error?: string;
}

export const REQUIRED_SCIENTIFIC_CHECKS = [
  "Scientific & Technical Integrity Check",
] as const;

export interface PullRequestChecksResult {
  prNumber: number;
  state: "open" | "closed";
  merged: boolean;
  headSha: string;
  checkStatus: "PENDING" | "RUNNING" | "SUCCESS" | "FAILED";
  checks: Array<{
    name: string;
    status: string;
    conclusion: string | null;
  }>;
}

/**
 * Valide une proposition de modification, applique les règles d'invalidation,
 * effectue un commit réel sur une branche dédiée, et crée une Pull Request sur GitHub.
 */
export async function createScientificProposalPR(
  params: ProposalRequest
): Promise<ProposalResult> {
  const {
    type,
    slug,
    proposedContent,
    checklistAnswers,
    reviewerNotes,
    userId,
    userEmail,
    baseFileSha,
  } = params;

  // 0. Vérification obligatoire du paramètre baseFileSha (Invariant Stale-Edit)
  if (!baseFileSha || typeof baseFileSha !== "string" || !baseFileSha.trim()) {
    throw new Error("Paramètre baseFileSha obligatoire pour protéger contre les modifications concurrentes.");
  }

  // 1. Validation de la checklist scientifique en 11 points
  const checklistCheck = validateChecklistAnswers(checklistAnswers);
  if (!checklistCheck.complete) {
    throw new Error(
      `Checklist scientifique incomplète : les points suivants doivent obligatoirement être validés : [${checklistCheck.missingChecks.join(
        ", "
      )}]`
    );
  }

  // 2. Chargement canonique depuis GitHub main (Source de Vérité Absolue)
  const canonical = await getCanonicalScientificContentFromGitHub(type, slug);
  const originalContent = canonical.content;

  // Détection des modifications concurrentes (Stale Edit / 409) basée sur le SHA Git réel
  if (baseFileSha !== canonical.gitBlobSha) {
    const err = new Error(
      "Conflit de concurrence (Stale Edit) : le fichier a été modifié sur GitHub main depuis l'ouverture de votre session. Veuillez recharger la page."
    );
    (err as unknown as { code: string }).code = "STALE_EDIT_CONFLICT";
    throw err;
  }

  // 3. Traitement de l'invalidation automatique des preuves modifiées
  const invalidations: string[] = [];
  let processedProposed = { ...proposedContent };

  if (type === "inquiry" && Array.isArray(processedProposed.inquiryEvidences)) {
    const origInquiryEvs = (originalContent.inquiryEvidences as InquiryEvidenceItem[]) || [];
    const propInquiryEvs = (processedProposed.inquiryEvidences as InquiryEvidenceItem[]) || [];

    const invResult = applyInquiryEvidenceInvalidation(origInquiryEvs, propInquiryEvs);
    if (invResult.hasInvalidations) {
      invalidations.push(...invResult.invalidations);
      processedProposed = {
        ...processedProposed,
        inquiryEvidences: invResult.processedInquiryEvidences,
      };
    }
  } else if (type === "lesson" && processedProposed.historicReference && originalContent.historicReference) {
    const origRef = originalContent.historicReference as EvidenceRecord;
    const propRef = processedProposed.historicReference as EvidenceRecord;
    const inv = applyEvidenceInvalidation(origRef, propRef);
    if (inv.hasCriticalChange) {
      if (inv.invalidationReason) invalidations.push(inv.invalidationReason);
      processedProposed = {
        ...processedProposed,
        historicReference: inv.invalidatedEvidence,
      };
    }
  }

  // 4. Validation de la transition éditoriale
  const currentStatus = (originalContent.editorialStatus || "DRAFT") as EditorialStatus;
  const targetStatus = (processedProposed.editorialStatus || currentStatus) as EditorialStatus;

  const currentEvidences: Array<{ id: string; citationStatus: "VERIFIED_VERBATIM" | "VERIFIED_PARAPHRASE" | "TO_BE_CHECKED" }> = [];
  if (type === "inquiry" && Array.isArray(processedProposed.inquiryEvidences)) {
    for (const ie of processedProposed.inquiryEvidences as InquiryEvidenceItem[]) {
      if (ie.evidence) {
        currentEvidences.push({
          id: ie.evidenceId || ie.evidence.id,
          citationStatus: ie.evidence.citationStatus,
        });
      }
    }
  } else if (type === "lesson" && processedProposed.historicReference) {
    const ref = processedProposed.historicReference as EvidenceRecord;
    currentEvidences.push({
      id: "historicReference",
      citationStatus: ref.citationStatus,
    });
  }

  const transitionCheck = validateEditorialTransition(currentStatus, targetStatus, {
    reviewerId: userId,
    reviewedAt: new Date().toISOString(),
    evidences: currentEvidences,
  });

  if (!transitionCheck.valid) {
    throw new Error(transitionCheck.error);
  }

  // 5. Pré-Validation Zod stricte du contenu proposé
  if (type === "lesson") {
    const zodResult = LessonFrontmatterSchema.safeParse(processedProposed);
    if (!zodResult.success) {
      throw new Error(
        `Validation Zod de la leçon échouée :\n${JSON.stringify(zodResult.error.format(), null, 2)}`
      );
    }
  } else if (type === "inquiry") {
    const zodResult = InquirySchema.safeParse(processedProposed);
    if (!zodResult.success) {
      throw new Error(
        `Validation Zod de l'enquête échouée :\n${JSON.stringify(zodResult.error.format(), null, 2)}`
      );
    }
  }

  // 6. Calcul du Diff Scientifique
  const diffs = computeScientificDiff(originalContent, processedProposed);

  // Rejet strict de toute Pull Request vide
  if (diffs.length === 0) {
    throw new Error("Aucune modification détectée par rapport à la version canonique : impossible d'ouvrir une Pull Request vide.");
  }

  // 7. Sérialisation du contenu à commiter
  let newRawContent: string;
  let repoFilePath: string;

  if (type === "lesson") {
    const { contentFr, ...frontmatterData } = processedProposed;
    newRawContent = matter.stringify((contentFr as string) || "", frontmatterData);
    repoFilePath = `content/lessons/${slug}.md`;
  } else {
    newRawContent = JSON.stringify(processedProposed, null, 2) + "\n";
    repoFilePath = `content/inquiries/${slug}.json`;
  }

  if (canonical.rawContent.trim() === newRawContent.trim()) {
    throw new Error("Le contenu sérialisé est identique au fichier original : impossible d'ouvrir une Pull Request vide.");
  }

  // 8. Préparation des métadonnées de la branche et de la PR
  const timestamp = Date.now();
  const branchName = `review/${type}-${slug}-${timestamp}`;
  const prTitle = `review(${type}): proposition de révision scientifique sur ${slug}`;
  const prBody = [
    `## 🔬 Proposition de Révision Scientifique TABAYYUN`,
    ``,
    `**Type** : \`${type}\` | **Cible** : \`${slug}\``,
    `**Auteur de la proposition** : ${userEmail} (\`${userId}\`)`,
    `**Branche source** : \`${branchName}\` $\\to$ \`main\``,
    ``,
    `### 📋 Checklist Scientifique de Relecture (11/11 validés)`,
    `- [x] Source primaire vérifiée`,
    `- [x] Verbatim arabe collationné`,
    `- [x] Édition et muḥaqqiq précisés`,
    `- [x] Pagination et numéro de hadith cohérents`,
    `- [x] Traduction fidèle et sans extrapolation`,
    `- [x] Conclusion proportionnée au degré d'établissement`,
    `- [x] Aucun evidenceId orphelin`,
    `- [x] Aucun consensus sans citation textuelle`,
    `- [x] Aucun « les Salaf » sans documentation nominative`,
    `- [x] Distinction ṣaḥīḥ vs istidlāl respectée`,
    `- [x] Bilinguisme FR/AR cohérent`,
    ``,
    invalidations.length > 0
      ? `### ⚠️ Alertes d'Invalidation Scientifique Automatique\n${invalidations.map((i) => `- ${i}`).join("\n")}\n`
      : ``,
    `### 📝 Diff Synthétique (${diffs.length} modification(s) détectée(s))`,
    diffs.map((d) => `- **[${d.severity}]** ${d.description}`).join("\n"),
    ``,
    reviewerNotes ? `### 💬 Notes du Relecteur\n> ${reviewerNotes}\n` : ``,
    `---`,
    `*Généré automatiquement par le Moteur de Gouvernance TABAYYUN. La CI GitHub Actions doit être au vert avant toute revue humaine et merge.*`,
  ].join("\n");

  // 9. Intégration GitHub (App / Token ou simulation locale sécurisée)
  const authHeader = await getGitHubAuthHeader();
  const repoOwner = process.env.GITHUB_REPOSITORY_OWNER || "novaskilltech";
  const repoName = process.env.GITHUB_REPOSITORY_NAME || "bayynah";

  let pullRequestUrl: string;
  let pullRequestNumber: number;
  let isSimulated = false;

  if (authHeader) {
    try {
      // a. Récupérer le SHA de main
      const refRes = await fetch(
        `https://api.github.com/repos/${repoOwner}/${repoName}/git/ref/heads/main`,
        {
          headers: {
            Authorization: authHeader,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );
      if (!refRes.ok) throw new Error(`Impossible de lire la branche main : ${refRes.status} ${refRes.statusText}`);
      const refData = await refRes.json();
      const mainSha = refData.object.sha;

      // b. Créer la branche review/...
      const createBranchRes = await fetch(
        `https://api.github.com/repos/${repoOwner}/${repoName}/git/refs`,
        {
          method: "POST",
          headers: {
            Authorization: authHeader,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ref: `refs/heads/${branchName}`,
            sha: mainSha,
          }),
        }
      );
      if (!createBranchRes.ok) throw new Error(`Échec création branche ${branchName} : ${createBranchRes.status} ${createBranchRes.statusText}`);

      // c. Récupérer le blob SHA du fichier existant sur la nouvelle branche
      const fileRes = await fetch(
        `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${repoFilePath}?ref=${branchName}`,
        {
          headers: {
            Authorization: authHeader,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );
      let fileSha: string | undefined;
      if (fileRes.ok) {
        const fileData = await fileRes.json();
        fileSha = fileData.sha;
      }

      // d. Créer le commit réel sur la branche avec le fichier modifié
      const commitRes = await fetch(
        `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${repoFilePath}`,
        {
          method: "PUT",
          headers: {
            Authorization: authHeader,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: `review(${type}): révision scientifique de ${slug}`,
            content: Buffer.from(newRawContent, "utf-8").toString("base64"),
            branch: branchName,
            ...(fileSha ? { sha: fileSha } : {}),
          }),
        }
      );
      if (!commitRes.ok) {
        throw new Error(`Échec du commit sur la branche ${branchName} : ${commitRes.status} ${commitRes.statusText}`);
      }

      // e. Créer la Pull Request
      const createPrRes = await fetch(
        `https://api.github.com/repos/${repoOwner}/${repoName}/pulls`,
        {
          method: "POST",
          headers: {
            Authorization: authHeader,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: prTitle,
            head: branchName,
            base: "main",
            body: prBody,
          }),
        }
      );
      if (!createPrRes.ok) throw new Error(`Échec création PR : ${createPrRes.status} ${createPrRes.statusText}`);
      const prData = await createPrRes.json();
      pullRequestUrl = prData.html_url;
      pullRequestNumber = prData.number;
    } catch (err: unknown) {
      console.error("Erreur interaction GitHub API:", err);
      // En production, échec fatal obligatoire (fail-closed, pas de fallback simulé)
      if (process.env.NODE_ENV === "production") {
        await recordAuditEvent("PROPOSAL_FAILED", userId, {
          type,
          slug,
          branchName,
          error: err instanceof Error ? err.message : String(err),
        });
        throw new Error(`Échec critique de l'intégration GitHub en production : ${err instanceof Error ? err.message : String(err)}`);
      }
      // Mode développement / test uniquement : simulation déterministe
      pullRequestUrl = `https://github.com/${repoOwner}/${repoName}/pull/simulated-${timestamp}`;
      pullRequestNumber = 900 + Math.floor(Math.random() * 100);
      isSimulated = true;
    }
  } else {
    // Absence de configuration GitHub
    if (process.env.NODE_ENV === "production") {
      throw new Error("Configuration GitHub manquante en production : GITHUB_APP_* ou GITHUB_TOKEN obligatoire.");
    }
    pullRequestUrl = `https://github.com/${repoOwner}/${repoName}/pull/simulated-${timestamp}`;
    pullRequestNumber = 100 + Math.floor(Math.random() * 100);
    isSimulated = true;
  }

  // 10. Enregistrement de l'événement dans les logs d'audit
  await recordAuditEvent("PROPOSAL_CREATED", userId, {
    type,
    slug,
    branchName,
    pullRequestUrl,
    pullRequestNumber,
    isSimulated,
    diffsCount: diffs.length,
    invalidationsCount: invalidations.length,
  });

  return {
    success: true,
    branchName,
    pullRequestUrl,
    pullRequestNumber,
    diffs,
    invalidations,
    isSimulated,
  };
}

/**
 * Récupère l'état et les vérifications CI d'une Pull Request sur GitHub
 */
export async function getPullRequestChecks(
  pullRequestNumber: number
): Promise<PullRequestChecksResult> {
  const authHeader = await getGitHubAuthHeader();
  const repoOwner = process.env.GITHUB_REPOSITORY_OWNER || "novaskilltech";
  const repoName = process.env.GITHUB_REPOSITORY_NAME || "bayynah";

  if (!authHeader) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("GitHub CI verification unavailable en production sans identifiants valides.");
    }
    // Mode dev/test : renvoyer un statut simulé
    return {
      prNumber: pullRequestNumber,
      state: "open",
      merged: false,
      headSha: "mock-head-sha",
      checkStatus: "SUCCESS",
      checks: [
        { name: "Scientific & Technical Integrity Check", status: "completed", conclusion: "success" },
      ],
    };
  }

  // 1. Récupérer les détails de la PR
  const prRes = await fetch(
    `https://api.github.com/repos/${repoOwner}/${repoName}/pulls/${pullRequestNumber}`,
    {
      headers: {
        Authorization: authHeader,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );
  if (!prRes.ok) {
    throw new Error(`Impossible de récupérer la PR #${pullRequestNumber} : ${prRes.statusText}`);
  }
  const prData = await prRes.json();
  const headSha = prData.head?.sha || "unknown";

  // 2. Récupérer les check runs pour headSha
  const checksRes = await fetch(
    `https://api.github.com/repos/${repoOwner}/${repoName}/commits/${headSha}/check-runs`,
    {
      headers: {
        Authorization: authHeader,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );
  if (!checksRes.ok) {
    throw new Error(`Impossible de récupérer les check runs pour ${headSha} : ${checksRes.statusText}`);
  }
  const checksData = await checksRes.json();
  const checkRuns = checksData.check_runs || [];

  let checkStatus: "PENDING" | "RUNNING" | "SUCCESS" | "FAILED" = "SUCCESS";

  if (checkRuns.length === 0) {
    checkStatus = "PENDING";
  } else if (checkRuns.some((c: { status: string }) => c.status !== "completed")) {
    checkStatus = "RUNNING";
  } else {
    // Tous les check runs sont terminés (completed)
    // a. Vérifier la présence obligatoire de tous les checks scientifiques requis
    const checkNames = new Set(checkRuns.map((c: { name: string }) => c.name));
    const missingRequired = REQUIRED_SCIENTIFIC_CHECKS.some((reqName) => !checkNames.has(reqName));

    if (missingRequired) {
      checkStatus = prData.state === "open" ? "PENDING" : "FAILED";
    } else {
      // b. Règle de conclusion stricte : TOUS les checks doivent être "success"
      // Toute autre conclusion terminale (failure, timed_out, cancelled, action_required, startup_failure, stale, neutral, skipped, null) -> FAILED
      const allSuccess = checkRuns.every((c: { conclusion: string | null }) => c.conclusion === "success");
      checkStatus = allSuccess ? "SUCCESS" : "FAILED";
    }
  }

  return {
    prNumber: pullRequestNumber,
    state: prData.state,
    merged: prData.merged || false,
    headSha,
    checkStatus,
    checks: checkRuns.map((c: { name: string; status: string; conclusion: string | null }) => ({
      name: c.name,
      status: c.status,
      conclusion: c.conclusion,
    })),
  };
}
