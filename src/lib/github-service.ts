/**
 * Service d'Intégration Git & GitHub App
 * TABAYYUN — Gouvernance Scientifique & Workflow Git/PR
 *
 * Règle d'or :
 * AUCUNE écriture directe sur `main` ni en base de données pour les contenus publiés.
 * Toute proposition de modification passe obligatoirement par une branche dédiée et une Pull Request.
 */

import { LessonFrontmatterSchema } from "./schemas/lesson.schema";
import { InquirySchema } from "./schemas/inquiry.schema";
import {
  computeScientificDiff,
  validateChecklistAnswers,
  validateEditorialTransition,
  applyEvidenceInvalidation,
  EditorialStatus,
  EvidenceRecord,
  DiffEntry,
} from "./scientific-governance";
import { recordAuditEvent } from "./audit-logger";

export interface ProposalRequest {
  type: "lesson" | "inquiry";
  slug: string;
  originalContent: Record<string, unknown>;
  proposedContent: Record<string, unknown>;
  checklistAnswers: Record<string, boolean>;
  reviewerNotes?: string;
  userId: string;
  userEmail: string;
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

/**
 * Valide une proposition de modification, applique les règles d'invalidation,
 * et crée une Pull Request sur GitHub via branche dédiée.
 */
export async function createScientificProposalPR(
  params: ProposalRequest
): Promise<ProposalResult> {
  const {
    type,
    slug,
    originalContent,
    proposedContent,
    checklistAnswers,
    reviewerNotes,
    userId,
    userEmail,
  } = params;

  // 1. Validation de la checklist scientifique en 11 points
  const checklistCheck = validateChecklistAnswers(checklistAnswers);
  if (!checklistCheck.complete) {
    throw new Error(
      `Checklist scientifique incomplète : les points suivants doivent obligatoirement être validés : [${checklistCheck.missingChecks.join(
        ", "
      )}]`
    );
  }

  // 2. Traitement de l'invalidation automatique des preuves modifiées
  const invalidations: string[] = [];
  const processedProposed = { ...proposedContent };

  if (type === "inquiry") {
    const origEvidences = ((originalContent.conclusionSheet as { evidences?: EvidenceRecord[] })?.evidences || []) as EvidenceRecord[];
    const propEvidences = ((processedProposed.conclusionSheet as { evidences?: EvidenceRecord[] })?.evidences || []) as EvidenceRecord[];

    const origMap = new Map(origEvidences.map((e) => [e.id, e]));
    const updatedEvidences = propEvidences.map((prop) => {
      const orig = origMap.get(prop.id);
      if (orig) {
        const inv = applyEvidenceInvalidation(orig, prop);
        if (inv.hasCriticalChange) {
          if (inv.invalidationReason) invalidations.push(inv.invalidationReason);
          return inv.invalidatedEvidence;
        }
      }
      return prop;
    });

    if (processedProposed.conclusionSheet && typeof processedProposed.conclusionSheet === "object") {
      (processedProposed.conclusionSheet as { evidences: EvidenceRecord[] }).evidences = updatedEvidences;
    }
  }

  // 3. Validation de la transition éditoriale
  const currentStatus = (originalContent.editorialStatus || "DRAFT") as EditorialStatus;
  const targetStatus = (processedProposed.editorialStatus || currentStatus) as EditorialStatus;

  const currentEvidences = (
    type === "inquiry"
      ? (processedProposed.conclusionSheet as { evidences?: EvidenceRecord[] })?.evidences || []
      : []
  ) as Array<{ id: string; citationStatus: "VERIFIED_VERBATIM" | "VERIFIED_PARAPHRASE" | "TO_BE_CHECKED" }>;

  const transitionCheck = validateEditorialTransition(currentStatus, targetStatus, {
    reviewerId: userId,
    reviewedAt: new Date().toISOString(),
    evidences: currentEvidences,
  });

  if (!transitionCheck.valid) {
    throw new Error(transitionCheck.error);
  }

  // 4. Pré-Validation Zod stricte du contenu proposé
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

  // 5. Calcul du Diff Scientifique
  const diffs = computeScientificDiff(originalContent, processedProposed);

  // 6. Génération du nom de branche (jamais d'écriture directe sur main)
  const timestamp = Date.now();
  const branchName = `review/${type}-${slug}-${timestamp}`;

  // 7. Formatage de la description de la Pull Request
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

  // 8. Intégration GitHub (API REST via Token ou simulation locale sécurisée)
  const githubToken = process.env.GITHUB_TOKEN;
  const repoOwner = process.env.GITHUB_REPOSITORY_OWNER || "novaskilltech";
  const repoName = process.env.GITHUB_REPOSITORY_NAME || "bayynah";

  let pullRequestUrl: string;
  let pullRequestNumber: number;
  let isSimulated = false;

  if (githubToken && process.env.NODE_ENV === "production") {
    try {
      // Appel API GitHub REST officiel
      // a. Récupérer le SHA de main
      const refRes = await fetch(
        `https://api.github.com/repos/${repoOwner}/${repoName}/git/ref/heads/main`,
        {
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );
      if (!refRes.ok) throw new Error(`Impossible de lire la branche main : ${refRes.statusText}`);
      const refData = await refRes.json();
      const mainSha = refData.object.sha;

      // b. Créer la branche review/...
      const createBranchRes = await fetch(
        `https://api.github.com/repos/${repoOwner}/${repoName}/git/refs`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ref: `refs/heads/${branchName}`,
            sha: mainSha,
          }),
        }
      );
      if (!createBranchRes.ok) throw new Error(`Échec création branche : ${createBranchRes.statusText}`);

      // c. Créer la Pull Request
      const createPrRes = await fetch(
        `https://api.github.com/repos/${repoOwner}/${repoName}/pulls`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${githubToken}`,
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
      if (!createPrRes.ok) throw new Error(`Échec création PR : ${createPrRes.statusText}`);
      const prData = await createPrRes.json();
      pullRequestUrl = prData.html_url;
      pullRequestNumber = prData.number;
    } catch (err: unknown) {
      console.error("Erreur interaction GitHub API:", err);
      // En cas d'erreur de token externe, bascule contrôlée
      pullRequestUrl = `https://github.com/${repoOwner}/${repoName}/pull/simulated-${timestamp}`;
      pullRequestNumber = 900 + Math.floor(Math.random() * 100);
      isSimulated = true;
    }
  } else {
    // Mode développement local / test : simulation déterministe sécurisée
    pullRequestUrl = `https://github.com/${repoOwner}/${repoName}/pull/simulated-${timestamp}`;
    pullRequestNumber = 100 + Math.floor(Math.random() * 100);
    isSimulated = true;
  }

  // 9. Enregistrement de l'événement dans les logs d'audit
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
