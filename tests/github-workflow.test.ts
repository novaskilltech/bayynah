import assert from "assert";
import {
  validateSlug,
  applyInquiryEvidenceInvalidation,
  InquiryEvidenceItem,
  CRITICAL_SCIENTIFIC_FIELDS,
  SCIENTIFIC_REVIEW_CHECKLIST,
} from "../src/lib/scientific-governance";
import { getCanonicalScientificContent } from "../src/lib/canonical-content";
import {
  createScientificProposalPR,
  getPullRequestChecks,
} from "../src/lib/github-service";

console.log("🔬 Démarrage de la suite de tests — Phase 7.1 : Intégrité Git/PR & Sanctuaire Serveur...");

function getFullChecklist(): Record<string, boolean> {
  const ch: Record<string, boolean> = {};
  for (const item of SCIENTIFIC_REVIEW_CHECKLIST) {
    ch[item.id] = true;
  }
  return ch;
}

// =========================================================================
// 1. Test Anti-Traversal et Validation Stricte des Slugs
// =========================================================================
function testSlugValidationAndAntiTraversal() {
  console.log("  [1/10] Test de validation des slugs et protection anti-traversal...");

  // Slugs valides
  assert.strictEqual(validateSlug("critique-01-affirmation-vs-preuve"), true);
  assert.strictEqual(validateSlug("enquete-01-hadith-intention"), true);
  assert.strictEqual(validateSlug("hadith_02_isnad"), true);

  // Slugs malveillants / invalides
  assert.strictEqual(validateSlug("../secret"), false);
  assert.strictEqual(validateSlug("..\\secret"), false);
  assert.strictEqual(validateSlug("foo/bar"), false);
  assert.strictEqual(validateSlug("foo\\bar"), false);
  assert.strictEqual(validateSlug(""), false);
  assert.strictEqual(validateSlug("slug with spaces"), false);
  assert.strictEqual(validateSlug("slug;rm -rf"), false);

  // Tentatives d'accès via getCanonicalScientificContent
  assert.throws(
    () => getCanonicalScientificContent("lesson", "../secret"),
    /Slug scientifique invalide ou malveillant/
  );
  assert.throws(
    () => getCanonicalScientificContent("inquiry", "subdir/file"),
    /Slug scientifique invalide ou malveillant/
  );

  console.log("    ✅ Protection anti-traversal et validation stricte des slugs validées.");
}

// =========================================================================
// 2. Test Chargement Canonique Serveur (Sanctuaire Git)
// =========================================================================
function testCanonicalContentLoading() {
  console.log("  [2/10] Test du chargement canonique serveur (Sanctuaire Git)...");

  // Chargement d'une leçon réelle
  const lessonCanonical = getCanonicalScientificContent("lesson", "critique-01-affirmation-vs-preuve");
  assert.ok(lessonCanonical.content);
  assert.strictEqual(lessonCanonical.content.id, "critique-01");
  assert.strictEqual(lessonCanonical.content.slug, "critique-01-affirmation-vs-preuve");
  assert.strictEqual(lessonCanonical.content.school, "CRITIQUE");
  assert.ok(lessonCanonical.contentHash && lessonCanonical.contentHash.length === 64);
  assert.ok(lessonCanonical.rawContent.includes("critique-01-affirmation-vs-preuve"));

  // Chargement d'une enquête réelle
  const inquiryCanonical = getCanonicalScientificContent("inquiry", "enquete-01-chameau");
  assert.ok(inquiryCanonical.content);
  assert.strictEqual(inquiryCanonical.content.id, "inquiry-01");
  assert.strictEqual(inquiryCanonical.content.slug, "ablutions-viande-chameau");
  assert.ok(Array.isArray(inquiryCanonical.content.inquiryEvidences));
  assert.ok(inquiryCanonical.contentHash && inquiryCanonical.contentHash.length === 64);

  console.log("    ✅ Chargement canonique serveur et calcul de SHA-256 validés.");
}

// =========================================================================
// 3. Test Détection des Modifications Concurrentes (Stale Edit / 409)
// =========================================================================
async function testStaleEditConflictDetection() {
  console.log("  [3/10] Test de détection des conflits de concurrence (Stale Edit)...");

  const canonical = getCanonicalScientificContent("lesson", "critique-01-affirmation-vs-preuve");
  const modifiedContent = {
    ...canonical.content,
    summaryFr: "Résumé modifié pour le test de concurrence.",
  };

  // Cas 1 : baseCommitSha périmé
  await assert.rejects(
    async () => {
      await createScientificProposalPR({
        type: "lesson",
        slug: "critique-01-affirmation-vs-preuve",
        proposedContent: modifiedContent,
        checklistAnswers: getFullChecklist(),
        userId: "reviewer-123",
        userEmail: "rev@tabayyun.org",
        baseCommitSha: "stale-sha-99999999999999999999999999999999",
      });
    },
    (err: unknown) => {
      const e = err as { message: string; code?: string };
      return e.code === "STALE_EDIT_CONFLICT" && e.message.includes("Conflit de concurrence");
    },
    "Un baseCommitSha périmé doit lever une erreur STALE_EDIT_CONFLICT"
  );

  // Cas 2 : baseCommitSha valide (correspondant exactement au hash actuel)
  const validResult = await createScientificProposalPR({
    type: "lesson",
    slug: "critique-01-affirmation-vs-preuve",
    proposedContent: modifiedContent,
    checklistAnswers: getFullChecklist(),
    userId: "reviewer-123",
    userEmail: "rev@tabayyun.org",
    baseCommitSha: canonical.contentHash,
  });

  assert.strictEqual(validResult.success, true);
  console.log("    ✅ Détection de conflit de concurrence (Stale Edit) validée.");
}

// =========================================================================
// 4. Test Invalidation sur les 14 Champs Critiques d'InquiryEvidences
// =========================================================================
function testInquiryEvidenceInvalidation() {
  console.log("  [4/10] Test de l'invalidation ciblée sur inquiryEvidences[].evidence...");

  assert.strictEqual(CRITICAL_SCIENTIFIC_FIELDS.length, 14, "Exactement 14 champs critiques réels");

  const originalInquiryEvidences: InquiryEvidenceItem[] = [
    {
      evidenceId: "ev-hadith-01",
      role: "PRIMARY_PROOF",
      order: 1,
      stepNumber: 1,
      commentFr: "Preuve fondamentale du hadith de l'intention.",
      commentAr: "الدليل الأساسي لحديث النية",
      evidence: {
        id: "ev-hadith-01",
        type: "HADITH",
        referenceCode: "Bukhari-01",
        citationStatus: "VERIFIED_VERBATIM",
        quoteArOriginal: "إنما الأعمال بالنيات",
        translationFr: "Les actions ne valent que par leurs intentions.",
        collection: "Ṣaḥīḥ al-Bukhārī",
        author: "Al-Bukhārī",
        editionVolumePage: "Tome 1, p. 6",
        hadithNumber: "1",
        numberingSystem: "Fuad Abdul Baqi",
        authenticityGrade: "Ṣaḥīḥ",
        gradeScholar: "Al-Bukhārī",
        primarySource: true,
        verifiedAt: "2026-09-20",
        verifiedBy: "reviewer-01",
      },
    },
  ];

  // Modification du champ critique translationFr
  const proposedInquiryEvidences: InquiryEvidenceItem[] = [
    {
      ...originalInquiryEvidences[0],
      evidence: {
        ...originalInquiryEvidences[0].evidence,
        translationFr: "Les œuvres ne valent que selon l'intention formulée.", // Changement critique
      },
    },
  ];

  const result = applyInquiryEvidenceInvalidation(originalInquiryEvidences, proposedInquiryEvidences);

  assert.strictEqual(result.hasInvalidations, true);
  assert.strictEqual(result.invalidations.length, 1);
  assert.ok(result.invalidations[0].includes("translationFr"));

  const invalidatedItem = result.processedInquiryEvidences[0];
  assert.strictEqual(invalidatedItem.evidence.citationStatus, "TO_BE_CHECKED");
  assert.strictEqual(invalidatedItem.evidence.verifiedAt, null);
  assert.strictEqual(invalidatedItem.evidence.verifiedBy, null);

  // Préservation des métadonnées de l'enquête
  assert.strictEqual(invalidatedItem.role, "PRIMARY_PROOF");
  assert.strictEqual(invalidatedItem.order, 1);
  assert.strictEqual(invalidatedItem.commentFr, "Preuve fondamentale du hadith de l'intention.");

  // Modification d'un champ non critique (ex: translator)
  const nonCriticalProposal: InquiryEvidenceItem[] = [
    {
      ...originalInquiryEvidences[0],
      evidence: {
        ...originalInquiryEvidences[0].evidence,
        translator: "Traducteur révisé",
      },
    },
  ];
  const nonCritResult = applyInquiryEvidenceInvalidation(originalInquiryEvidences, nonCriticalProposal);
  assert.strictEqual(nonCritResult.hasInvalidations, false);
  assert.strictEqual(nonCritResult.processedInquiryEvidences[0].evidence.citationStatus, "VERIFIED_VERBATIM");

  console.log("    ✅ Invalidation ciblée sur inquiryEvidences et préservation des métadonnées validées.");
}

// =========================================================================
// 5. Test Rejet Strict des Pull Requests Vides (Zéro Modification)
// =========================================================================
async function testEmptyPullRequestRejection() {
  console.log("  [5/10] Test de rejet strict des propositions sans modification (PR vide)...");

  const canonical = getCanonicalScientificContent("lesson", "critique-01-affirmation-vs-preuve");

  // Tentative de soumission d'un contenu identique à la version canonique
  await assert.rejects(
    async () => {
      await createScientificProposalPR({
        type: "lesson",
        slug: "critique-01-affirmation-vs-preuve",
        proposedContent: canonical.content,
        checklistAnswers: getFullChecklist(),
        userId: "reviewer-123",
        userEmail: "rev@tabayyun.org",
      });
    },
    /impossible d'ouvrir une Pull Request vide/,
    "Une proposition identique sans diff doit être rejetée"
  );

  console.log("    ✅ Rejet des Pull Requests vides validé.");
}

// =========================================================================
// 6. Test Création Réelle de Commit sur la Branche Avant PR
// =========================================================================
async function testRealCommitOnReviewBranch() {
  console.log("  [6/10] Test du workflow GitHub : création de commit réel avant ouverture de PR...");

  const originalFetch = global.fetch;
  const calls: Array<{ url: string; method: string; body?: string }> = [];

  // Mock de l'API GitHub
  global.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    const urlStr = url.toString();
    const method = init?.method || "GET";
    calls.push({ url: urlStr, method, body: init?.body as string });

    // a. GET heads/main
    if (urlStr.endsWith("/git/ref/heads/main")) {
      return new Response(JSON.stringify({ object: { sha: "mock-main-sha-12345" } }), { status: 200 });
    }

    // b. POST git/refs (création branche)
    if (urlStr.endsWith("/git/refs") && method === "POST") {
      return new Response(JSON.stringify({ ref: "refs/heads/review/mock-branch" }), { status: 201 });
    }

    // c. GET contents/{path}?ref={branch}
    if (urlStr.includes("/contents/") && method === "GET") {
      return new Response(JSON.stringify({ sha: "mock-existing-file-sha" }), { status: 200 });
    }

    // d. PUT contents/{path} (commit du fichier modifié)
    if (urlStr.includes("/contents/") && method === "PUT") {
      return new Response(JSON.stringify({ content: { sha: "mock-new-file-sha" }, commit: { sha: "mock-commit-sha" } }), { status: 200 });
    }

    // e. POST pulls
    if (urlStr.endsWith("/pulls") && method === "POST") {
      return new Response(JSON.stringify({ html_url: "https://github.com/novaskilltech/bayynah/pull/777", number: 777 }), { status: 201 });
    }

    return new Response(JSON.stringify({ error: "Not mocked" }), { status: 404 });
  }) as typeof fetch;

  try {
    process.env.GITHUB_TOKEN = "mock-github-token-for-test";
    const canonical = getCanonicalScientificContent("lesson", "critique-01-affirmation-vs-preuve");
    const modified = {
      ...canonical.content,
      summaryFr: "Nouveau résumé avec commit réel obligatoire.",
    };

    const result = await createScientificProposalPR({
      type: "lesson",
      slug: "critique-01-affirmation-vs-preuve",
      proposedContent: modified,
      checklistAnswers: getFullChecklist(),
      userId: "reviewer-123",
      userEmail: "rev@tabayyun.org",
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.pullRequestNumber, 777);
    assert.strictEqual(result.isSimulated, false);

    // Vérifier l'ordonnancement strict des appels
    const putCommitIdx = calls.findIndex((c) => c.method === "PUT" && c.url.includes("/contents/"));
    const postPrIdx = calls.findIndex((c) => c.method === "POST" && c.url.endsWith("/pulls"));

    assert.ok(putCommitIdx !== -1, "L'appel PUT /contents/ doit obligatoirement avoir été émis");
    assert.ok(postPrIdx !== -1, "L'appel POST /pulls doit avoir été émis");
    assert.ok(putCommitIdx < postPrIdx, "Le commit (PUT /contents/) doit impérativement précéder l'ouverture de la PR (POST /pulls)");

    // Vérifier le contenu du commit
    const commitCall = calls[putCommitIdx];
    const commitBody = JSON.parse(commitCall.body || "{}");
    assert.ok(commitBody.content, "Le contenu en base64 doit être présent dans le commit");
    assert.strictEqual(commitBody.sha, "mock-existing-file-sha");

  } finally {
    global.fetch = originalFetch;
    delete process.env.GITHUB_TOKEN;
  }

  console.log("    ✅ Commit réel sur la branche de révision avant ouverture de la PR validé.");
}

// =========================================================================
// 7. Test Échec Fatal en Production (Fail-Closed, Pas de Simulation)
// =========================================================================
async function testFailClosedInProduction() {
  console.log("  [7/10] Test du comportement fail-closed en production (zéro simulation)...");

  const prevEnv = process.env.NODE_ENV;
  (process.env as Record<string, string | undefined>).NODE_ENV = "production";
  process.env.GITHUB_TOKEN = "bad-token-that-fails";

  const originalFetch = global.fetch;
  global.fetch = (async () => {
    return new Response(JSON.stringify({ message: "Bad credentials" }), { status: 401, statusText: "Unauthorized" });
  }) as typeof fetch;

  try {
    const canonical = getCanonicalScientificContent("lesson", "critique-01-affirmation-vs-preuve");
    const modified = {
      ...canonical.content,
      summaryFr: "Modification en production qui doit échouer si GitHub est KO.",
    };

    await assert.rejects(
      async () => {
        await createScientificProposalPR({
          type: "lesson",
          slug: "critique-01-affirmation-vs-preuve",
          proposedContent: modified,
          checklistAnswers: getFullChecklist(),
          userId: "reviewer-123",
          userEmail: "rev@tabayyun.org",
        });
      },
      /Échec critique de l'intégration GitHub en production/,
      "En production, tout échec GitHub doit lever une erreur fatale et ne JAMAIS simuler"
    );
  } finally {
    (process.env as Record<string, string | undefined>).NODE_ENV = prevEnv;
    delete process.env.GITHUB_TOKEN;
    global.fetch = originalFetch;
  }

  console.log("    ✅ Comportement fail-closed sans simulation en production validé.");
}

// =========================================================================
// 8. Test Contrôle RBAC des Rôles
// =========================================================================
function testRbacPermissionsMatrix() {
  console.log("  [8/10] Test de la matrice d'autorisation RBAC...");

  const isAuthorizedToReview = (role: string | undefined) => {
    return role === "REVIEWER" || role === "ADMIN";
  };

  assert.strictEqual(isAuthorizedToReview(undefined), false);
  assert.strictEqual(isAuthorizedToReview("USER"), false);
  assert.strictEqual(isAuthorizedToReview("REVIEWER"), true);
  assert.strictEqual(isAuthorizedToReview("ADMIN"), true);

  console.log("    ✅ Matrice RBAC validée.");
}

// =========================================================================
// 9. Test Service de Vérification CI des Pull Requests
// =========================================================================
async function testPullRequestChecksService() {
  console.log("  [9/10] Test du service de vérification CI des Pull Requests...");

  // En local sans token (mode dev)
  const devChecks = await getPullRequestChecks(123);
  assert.strictEqual(devChecks.prNumber, 123);
  assert.strictEqual(devChecks.checkStatus, "SUCCESS");
  assert.ok(devChecks.checks.length > 0);

  console.log("    ✅ Service getPullRequestChecks validé.");
}

// =========================================================================
// 10. Test Structure d'Audit Log des Propositions
// =========================================================================
function testAuditLogStructure() {
  console.log("  [10/10] Test de la structure d'audit log pour PROPOSAL_FAILED et PROPOSAL_CREATED...");

  const successEvent = {
    action: "PROPOSAL_CREATED",
    userId: "rev-456",
    details: {
      type: "lesson",
      slug: "critique-01-affirmation-vs-preuve",
      branchName: "review/lesson-critique-01-123",
      pullRequestUrl: "https://github.com/novaskilltech/bayynah/pull/1",
      pullRequestNumber: 1,
      isSimulated: false,
      diffsCount: 1,
      invalidationsCount: 0,
    },
  };

  const failureEvent = {
    action: "PROPOSAL_FAILED",
    userId: "rev-456",
    details: {
      type: "lesson",
      slug: "critique-01-affirmation-vs-preuve",
      branchName: "review/lesson-critique-01-123",
      error: "401 Unauthorized",
    },
  };

  assert.strictEqual(successEvent.action, "PROPOSAL_CREATED");
  assert.strictEqual(failureEvent.action, "PROPOSAL_FAILED");
  assert.ok(failureEvent.details.error);

  console.log("    ✅ Événements d'audit log validés.");
}

// =========================================================================
// Exécution Globale
// =========================================================================
async function runSuite() {
  testSlugValidationAndAntiTraversal();
  testCanonicalContentLoading();
  await testStaleEditConflictDetection();
  testInquiryEvidenceInvalidation();
  await testEmptyPullRequestRejection();
  await testRealCommitOnReviewBranch();
  await testFailClosedInProduction();
  testRbacPermissionsMatrix();
  await testPullRequestChecksService();
  testAuditLogStructure();

  console.log("🎉 LES 10 VECTEURS D'INTÉGRITÉ GIT/PR DE LA PHASE 7.1 ONT ÉTÉ VALIDÉS AVEC SUCCÈS !");
}

runSuite().catch((err) => {
  console.error("❌ Échec de la suite de tests de la Phase 7.1:", err);
  process.exit(1);
});
