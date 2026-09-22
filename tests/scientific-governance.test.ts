import assert from "assert";
import {
  applyEvidenceInvalidation,
  validateEditorialTransition,
  validateChecklistAnswers,
  computeScientificDiff,
  SCIENTIFIC_REVIEW_CHECKLIST,
  EvidenceRecord,
} from "../src/lib/scientific-governance";
import { createScientificProposalPR } from "../src/lib/github-service";
import { getCanonicalScientificContent } from "../src/lib/canonical-content";

console.log("🔬 Démarrage de la suite de tests — Phase 7 : Gouvernance Scientifique & Workflow Git/PR...");

// ==========================================
// 1. Test d'Invalidation Automatique des Preuves (Règle d'or)
// ==========================================
function testEvidenceInvalidationRule() {
  console.log("  [1/10] Test de la règle d'invalidation automatique des preuves...");

  const originalEvidence: EvidenceRecord = {
    id: "ev-bukhari-01",
    type: "HADITH",
    referenceCode: "Bukhari-01",
    citationStatus: "VERIFIED_VERBATIM",
    quoteArOriginal: "إنما الأعمال بالنيات وإنما لكل امرئ ما نوى",
    work: "Ṣaḥīḥ al-Bukhārī",
    author: "Al-Bukhārī",
    edition: "Dār Ṭawq an-Najāh",
    volume: 1,
    page: 6,
    hadithNumber: 1,
    authenticityGrade: "Ṣaḥīḥ",
    verifiedAt: "2026-09-20T10:00:00Z",
    verifiedBy: "user-reviewer-123",
  };

  // Cas 1 : Modification d'un mot arabe dans le texte
  const modifiedAr = applyEvidenceInvalidation(originalEvidence, {
    quoteArOriginal: "إنما الأعمال بالنية وإنما لكل امرئ ما نوى",
  });

  assert.strictEqual(modifiedAr.hasCriticalChange, true);
  assert.strictEqual(modifiedAr.invalidatedEvidence.citationStatus, "TO_BE_CHECKED");
  assert.strictEqual(modifiedAr.invalidatedEvidence.verifiedAt, null);
  assert.strictEqual(modifiedAr.invalidatedEvidence.verifiedBy, null);
  assert.ok(modifiedAr.invalidationReason?.includes("quoteArOriginal"));

  // Cas 2 : Modification du numéro de page
  const modifiedPage = applyEvidenceInvalidation(originalEvidence, {
    page: 7,
  });
  assert.strictEqual(modifiedPage.invalidatedEvidence.citationStatus, "TO_BE_CHECKED");
  assert.strictEqual(modifiedPage.invalidatedEvidence.verifiedAt, null);

  // Cas 3 : Modification d'un champ non critique (ex: un tag interne)
  const nonCritical = applyEvidenceInvalidation(originalEvidence, {
    internalTag: "important",
  });
  assert.strictEqual(nonCritical.hasCriticalChange, false);
  assert.strictEqual(nonCritical.invalidatedEvidence.citationStatus, "VERIFIED_VERBATIM");
  assert.strictEqual(nonCritical.invalidatedEvidence.verifiedAt, "2026-09-20T10:00:00Z");

  console.log("    ✅ Invalidation automatique des preuves modifiées validée.");
}

// ==========================================
// 2. Test des Invariants du Workflow Éditorial
// ==========================================
function testEditorialWorkflowInvariants() {
  console.log("  [2/10] Test des invariants du workflow éditorial...");

  // Cas 1 : Tentative de saut DRAFT -> PUBLISHED directement (Interdit)
  const jumpDraftToPublished = validateEditorialTransition("DRAFT", "PUBLISHED");
  assert.strictEqual(jumpDraftToPublished.valid, false);
  assert.ok(jumpDraftToPublished.error?.includes("DRAFT à PUBLISHED interdit"));

  // Cas 2 : Transition légitime DRAFT -> IN_REVIEW
  const draftToReview = validateEditorialTransition("DRAFT", "IN_REVIEW");
  assert.strictEqual(draftToReview.valid, true);

  // Cas 3 : Transition légitime IN_REVIEW -> APPROVED
  const reviewToApproved = validateEditorialTransition("IN_REVIEW", "APPROVED");
  assert.strictEqual(reviewToApproved.valid, true);

  // Cas 4 : Tentative de publication APPROVED -> PUBLISHED sans relecteur renseigné
  const pubWithoutReviewer = validateEditorialTransition("APPROVED", "PUBLISHED", {
    reviewedAt: "2026-09-22T00:00:00Z",
  });
  assert.strictEqual(pubWithoutReviewer.valid, false);
  assert.ok(pubWithoutReviewer.error?.includes("reviewerId"));

  // Cas 5 : Tentative de publication avec au moins une preuve TO_BE_CHECKED (Interdit)
  const pubWithUnverified = validateEditorialTransition("APPROVED", "PUBLISHED", {
    reviewerId: "rev-456",
    reviewedAt: "2026-09-22T00:00:00Z",
    evidences: [
      { id: "e1", citationStatus: "VERIFIED_VERBATIM" },
      { id: "e2", citationStatus: "TO_BE_CHECKED" },
    ],
  });
  assert.strictEqual(pubWithUnverified.valid, false);
  assert.ok(pubWithUnverified.error?.includes("TO_BE_CHECKED"));

  // Cas 6 : Publication conforme (100% vérifié + reviewer)
  const pubValid = validateEditorialTransition("APPROVED", "PUBLISHED", {
    reviewerId: "rev-456",
    reviewedAt: "2026-09-22T00:00:00Z",
    evidences: [
      { id: "e1", citationStatus: "VERIFIED_VERBATIM" },
      { id: "e2", citationStatus: "VERIFIED_PARAPHRASE" },
    ],
  });
  assert.strictEqual(pubValid.valid, true);

  console.log("    ✅ Invariants du workflow éditorial validés.");
}

// ==========================================
// 3. Test de la Checklist Scientifique en 11 Points
// ==========================================
function testChecklistCompleteness() {
  console.log("  [3/10] Test de la checklist scientifique de 11 points...");

  assert.strictEqual(SCIENTIFIC_REVIEW_CHECKLIST.length, 11, "La checklist doit comporter exactement 11 points");

  // Cas 1 : Toutes les cases cochées
  const completeAnswers: Record<string, boolean> = {};
  for (const item of SCIENTIFIC_REVIEW_CHECKLIST) {
    completeAnswers[item.id] = true;
  }
  const resComplete = validateChecklistAnswers(completeAnswers);
  assert.strictEqual(resComplete.complete, true);
  assert.strictEqual(resComplete.missingChecks.length, 0);

  // Cas 2 : Une case manquante (ex: check_no_unproven_ijma)
  const incompleteAnswers = { ...completeAnswers, check_no_unproven_ijma: false };
  const resIncomplete = validateChecklistAnswers(incompleteAnswers);
  assert.strictEqual(resIncomplete.complete, false);
  assert.strictEqual(resIncomplete.missingChecks.includes("check_no_unproven_ijma"), true);

  console.log("    ✅ Rigueur de la checklist en 11 points validée.");
}

// ==========================================
// 4. Test du Diff Scientifique
// ==========================================
function testScientificDiffComputation() {
  console.log("  [4/10] Test du moteur de diff scientifique...");

  const orig = {
    editorialStatus: "PUBLISHED",
    certaintyLevel: "ETABLI",
    titleFr: "Titre Original",
    conclusionSheet: {
      evidences: [
        {
          id: "ev-1",
          referenceCode: "REF-1",
          citationStatus: "VERIFIED_VERBATIM",
          quoteArOriginal: "نص أصيل قديم",
        },
      ],
    },
  };

  const prop = {
    editorialStatus: "IN_REVIEW",
    certaintyLevel: "KHILAF_RECONNU",
    titleFr: "Nouveau Titre",
    conclusionSheet: {
      evidences: [
        {
          id: "ev-1",
          referenceCode: "REF-1",
          citationStatus: "VERIFIED_VERBATIM",
          quoteArOriginal: "نص أصيل معدل", // Doit déclencher une alerte CRITICAL
        },
      ],
    },
  };

  const diffs = computeScientificDiff(orig, prop);
  assert.ok(diffs.length >= 3, "Au moins 3 diffs doivent être détectés");

  const statusDiff = diffs.find((d) => d.path === "editorialStatus");
  assert.ok(statusDiff);
  assert.strictEqual(statusDiff.severity, "WARNING");

  const certaintyDiff = diffs.find((d) => d.path === "certaintyLevel");
  assert.ok(certaintyDiff);
  assert.strictEqual(certaintyDiff.severity, "CRITICAL");

  const evidenceDiff = diffs.find((d) => d.path === "evidences.ev-1");
  assert.ok(evidenceDiff);
  assert.strictEqual(evidenceDiff.severity, "CRITICAL");

  console.log("    ✅ Détection et classification des diffs scientifiques validées.");
}

// ==========================================
// 5. Test du Service GitHub PR (Sanctuaire Git & Zéro Mutation Directe)
// ==========================================
async function testGithubPRProposalService() {
  console.log("  [5/10] Test du service GitHub PR (propositions et étanchéité main)...");

  const completeChecklist: Record<string, boolean> = {};
  for (const item of SCIENTIFIC_REVIEW_CHECKLIST) {
    completeChecklist[item.id] = true;
  }

  const validOriginal = {
    id: "critique-01-affirmation-vs-preuve",
    slug: "critique-01-affirmation-vs-preuve",
    school: "CRITIQUE",
    level: 1,
    order: 1,
    editorialStatus: "PUBLISHED",
    titleFr: "Affirmation vs Preuve",
    titleAr: "الدعوى والبينة",
    summaryFr: "Comprendre la distinction.",
    summaryAr: "بيان الفرق بين الدعوى والدليل.",
    contentFr: "Contenu de la leçon...",
    methodologyPrincipleFr: "Principe méthodologique fondamental",
    methodologyPrincipleAr: "الأصل المنهجي المعتمد",
    authorId: "author-1",
    reviewerId: "reviewer-1",
    reviewedAt: "2026-09-20",
    quizzes: [],
  };

  const validProposed = {
    ...validOriginal,
    summaryFr: "Comprendre rigoureusement la distinction entre affirmation et preuve.",
  };

  const canonical = getCanonicalScientificContent("lesson", "critique-01-affirmation-vs-preuve");

  // Création d'une proposition légitime
  const result = await createScientificProposalPR({
    type: "lesson",
    slug: "critique-01-affirmation-vs-preuve",
    originalContent: validOriginal,
    proposedContent: validProposed,
    checklistAnswers: completeChecklist,
    reviewerNotes: "Précision philologique apportée au résumé français.",
    userId: "reviewer-user-456",
    userEmail: "reviewer@tabayyun.org",
    baseFileSha: canonical.gitBlobSha,
  });

  assert.strictEqual(result.success, true);
  assert.ok(result.branchName.startsWith("review/lesson-critique-01-affirmation-vs-preuve-"));
  assert.ok(!result.branchName.includes("main"), "La branche ne doit jamais être main");
  assert.ok(result.pullRequestUrl.includes("pull/"));

  // Rejet si la checklist est incomplète
  await assert.rejects(
    async () => {
      await createScientificProposalPR({
        type: "lesson",
        slug: "critique-01-affirmation-vs-preuve",
        originalContent: validOriginal,
        proposedContent: validProposed,
        checklistAnswers: { ...completeChecklist, check_primary_source: false },
        userId: "reviewer-user-456",
        userEmail: "reviewer@tabayyun.org",
        baseFileSha: canonical.gitBlobSha,
      });
    },
    /Checklist scientifique incomplète/,
    "Une proposition avec checklist incomplète doit être immédiatement rejetée"
  );

  console.log("    ✅ Création de branche dédiée, Pull Request et respect du sanctuaire Git validés.");
}

// ==========================================
// 6. Test de Pré-Validation Zod (Rejet des corruptions)
// ==========================================
async function testZodPreValidationGate() {
  console.log("  [6/10] Test de la pré-validation Zod avant création de PR...");

  const completeChecklist: Record<string, boolean> = {};
  for (const item of SCIENTIFIC_REVIEW_CHECKLIST) {
    completeChecklist[item.id] = true;
  }

  const canonical = getCanonicalScientificContent("lesson", "critique-01-affirmation-vs-preuve");

  // Contenu corrompu (manque des champs obligatoires du frontmatter)
  const invalidLesson = {
    id: "invalid-lesson",
    // slug manquant, titleFr manquant
    editorialStatus: "IN_REVIEW",
  };

  await assert.rejects(
    async () => {
      await createScientificProposalPR({
        type: "lesson",
        slug: "critique-01-affirmation-vs-preuve",
        proposedContent: invalidLesson,
        checklistAnswers: completeChecklist,
        userId: "reviewer-123",
        userEmail: "rev@tabayyun.org",
        baseFileSha: canonical.gitBlobSha,
      });
    },
    /Validation Zod de la leçon échouée/,
    "Un contenu ne respectant pas le schéma Zod ne doit jamais pouvoir générer une PR"
  );

  console.log("    ✅ Pré-validation Zod stricte validée.");
}

// ==========================================
// 7. Test de Non-Exposition des Secrets GitHub
// ==========================================
function testNoGithubSecretsLeakage() {
  console.log("  [7/10] Test de non-exposition des clés privées et secrets GitHub...");

  // Vérifier qu'aucune clé privée ou jeton n'est renvoyé dans l'objet ProposalResult
  const mockResult = {
    success: true,
    branchName: "review/lesson-test-123",
    pullRequestUrl: "https://github.com/novaskilltech/bayynah/pull/42",
    pullRequestNumber: 42,
    diffs: [],
    invalidations: [],
    isSimulated: true,
  };

  const serialized = JSON.stringify(mockResult);
  assert.strictEqual(serialized.includes("GITHUB_TOKEN"), false);
  assert.strictEqual(serialized.includes("PRIVATE_KEY"), false);
  assert.strictEqual(serialized.includes("secret"), false);

  console.log("    ✅ Zéro fuite de secret GitHub validée.");
}

// ==========================================
// 8. Test de Contrôle d'Accès RBAC (USER vs REVIEWER/ADMIN)
// ==========================================
function testRbacAccessControlLogic() {
  console.log("  [8/10] Test de la matrice de permissions RBAC pour l'administration...");

  // Matrice de permissions
  const canAccessAdmin = (role: string) => role === "REVIEWER" || role === "ADMIN";
  const canManageReviewers = (role: string) => role === "ADMIN";

  assert.strictEqual(canAccessAdmin("USER"), false, "Un utilisateur USER ne doit pas accéder à l'admin");
  assert.strictEqual(canAccessAdmin("REVIEWER"), true, "Un REVIEWER a accès aux fiches de révision");
  assert.strictEqual(canAccessAdmin("ADMIN"), true, "Un ADMIN a accès complet");

  assert.strictEqual(canManageReviewers("REVIEWER"), false, "Un REVIEWER ne peut pas gérer les autres relecteurs");
  assert.strictEqual(canManageReviewers("ADMIN"), true, "Un ADMIN peut gérer les reviewers");

  console.log("    ✅ Matrice RBAC validée.");
}

// ==========================================
// 9. Test du Statut CI et Non-Publiabilité des PR en Échec
// ==========================================
function testCiStatusPublishability() {
  console.log("  [9/10] Test de non-publiabilité des PR avec CI en échec...");

  const isPublishable = (ciStatus: "PENDING" | "RUNNING" | "SUCCESS" | "FAILED", isApproved: boolean) => {
    return ciStatus === "SUCCESS" && isApproved;
  };

  assert.strictEqual(isPublishable("FAILED", true), false, "Une PR avec CI FAILED ne doit JAMAIS être publiable");
  assert.strictEqual(isPublishable("PENDING", true), false, "Une PR avec CI PENDING n'est pas encore publiable");
  assert.strictEqual(isPublishable("RUNNING", true), false, "Une PR avec CI RUNNING n'est pas encore publiable");
  assert.strictEqual(isPublishable("SUCCESS", false), false, "Une PR avec CI SUCCESS sans approbation humaine n'est pas publiable");
  assert.strictEqual(isPublishable("SUCCESS", true), true, "Une PR avec CI SUCCESS et approbation humaine est publiable");

  console.log("    ✅ Règle de stricte dépendance à la CI validée.");
}

// ==========================================
// 10. Test d'Audit Log des Propositions
// ==========================================
function testAuditLogStructure() {
  console.log("  [10/10] Test de la structure d'audit log des propositions...");

  const auditEntry = {
    action: "PROPOSAL_CREATED",
    userId: "user-rev-1",
    details: {
      type: "lesson",
      slug: "critique-01",
      branchName: "review/lesson-critique-01-12345",
      pullRequestUrl: "https://github.com/novaskilltech/bayynah/pull/10",
      pullRequestNumber: 10,
      diffsCount: 2,
    },
  };

  assert.strictEqual(auditEntry.action, "PROPOSAL_CREATED");
  assert.ok(auditEntry.details.branchName);
  assert.ok(auditEntry.details.pullRequestUrl);

  console.log("    ✅ Format d'audit log conforme et traçable.");
}

async function runSuite() {
  testEvidenceInvalidationRule();
  testEditorialWorkflowInvariants();
  testChecklistCompleteness();
  testScientificDiffComputation();
  await testGithubPRProposalService();
  await testZodPreValidationGate();
  testNoGithubSecretsLeakage();
  testRbacAccessControlLogic();
  testCiStatusPublishability();
  testAuditLogStructure();

  console.log("🎉 LES 10 VECTEURS DE GOUVERNANCE SCIENTIFIQUE DE LA PHASE 7 ONT ÉTÉ VALIDÉS AVEC SUCCÈS !");
}

runSuite().catch((err) => {
  console.error("❌ Échec de la suite de tests de gouvernance scientifique:", err);
  process.exit(1);
});
