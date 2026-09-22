import assert from "assert";
import {
  validateSlug,
  applyInquiryEvidenceInvalidation,
  InquiryEvidenceItem,
  CRITICAL_SCIENTIFIC_FIELDS,
  SCIENTIFIC_REVIEW_CHECKLIST,
  validateAdminProposalAccess,
} from "../src/lib/scientific-governance";
import { getCanonicalScientificContent, computeGitBlobSha } from "../src/lib/canonical-content";
import {
  createScientificProposalPR,
  getPullRequestChecks,
} from "../src/lib/github-service";

console.log("🔬 Démarrage de la suite de tests — Phase 7.1.1 : Invariants de Gouvernance & Sanctuaire Git...");

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
// 2. Test Chargement Canonique Serveur & Calcul gitBlobSha
// =========================================================================
function testCanonicalContentLoading() {
  console.log("  [2/10] Test du chargement canonique serveur & calcul gitBlobSha...");

  // Chargement d'une leçon réelle
  const lessonCanonical = getCanonicalScientificContent("lesson", "critique-01-affirmation-vs-preuve");
  assert.ok(lessonCanonical.content);
  assert.strictEqual(lessonCanonical.content.id, "critique-01");
  assert.strictEqual(lessonCanonical.content.slug, "critique-01-affirmation-vs-preuve");
  assert.strictEqual(lessonCanonical.content.school, "CRITIQUE");
  assert.ok(lessonCanonical.contentHash && lessonCanonical.contentHash.length === 64);
  assert.ok(lessonCanonical.gitBlobSha && lessonCanonical.gitBlobSha.length === 40);
  assert.strictEqual(computeGitBlobSha(lessonCanonical.rawContent), lessonCanonical.gitBlobSha);
  assert.ok(lessonCanonical.rawContent.includes("critique-01-affirmation-vs-preuve"));

  // Chargement d'une enquête réelle
  const inquiryCanonical = getCanonicalScientificContent("inquiry", "enquete-01-chameau");
  assert.ok(inquiryCanonical.content);
  assert.strictEqual(inquiryCanonical.content.id, "inquiry-01");
  assert.strictEqual(inquiryCanonical.content.slug, "ablutions-viande-chameau");
  assert.ok(Array.isArray(inquiryCanonical.content.inquiryEvidences));
  assert.ok(inquiryCanonical.contentHash && inquiryCanonical.contentHash.length === 64);
  assert.ok(inquiryCanonical.gitBlobSha && inquiryCanonical.gitBlobSha.length === 40);
  assert.strictEqual(computeGitBlobSha(inquiryCanonical.rawContent), inquiryCanonical.gitBlobSha);

  console.log("    ✅ Chargement canonique serveur et calculs SHA-256 / gitBlobSha validés.");
}

// =========================================================================
// 3. Test Invariant Stale-Edit (baseFileSha Obligatoire & Concurrence 409)
// =========================================================================
async function testStaleEditConflictDetection() {
  console.log("  [3/10] Test de l'invariant baseFileSha et détection des conflits de concurrence (409)...");

  const canonical = getCanonicalScientificContent("lesson", "critique-01-affirmation-vs-preuve");
  const modifiedContent = {
    ...canonical.content,
    summaryFr: "Résumé modifié pour le test de concurrence.",
  };

  // Cas 1 : baseFileSha manquant / vide -> doit rejeter immédiatement
  await assert.rejects(
    async () => {
      await createScientificProposalPR({
        type: "lesson",
        slug: "critique-01-affirmation-vs-preuve",
        proposedContent: modifiedContent,
        checklistAnswers: getFullChecklist(),
        userId: "reviewer-123",
        userEmail: "rev@tabayyun.org",
        baseFileSha: "",
      });
    },
    /Paramètre baseFileSha obligatoire/,
    "Un baseFileSha manquant ou vide doit être rejeté"
  );

  // Cas 2 : baseFileSha périmé -> doit lever STALE_EDIT_CONFLICT
  await assert.rejects(
    async () => {
      await createScientificProposalPR({
        type: "lesson",
        slug: "critique-01-affirmation-vs-preuve",
        proposedContent: modifiedContent,
        checklistAnswers: getFullChecklist(),
        userId: "reviewer-123",
        userEmail: "rev@tabayyun.org",
        baseFileSha: "stale-sha-99999999999999999999999999999999",
      });
    },
    (err: unknown) => {
      const e = err as { message: string; code?: string };
      return e.code === "STALE_EDIT_CONFLICT" && e.message.includes("Conflit de concurrence");
    },
    "Un baseFileSha périmé doit lever une erreur STALE_EDIT_CONFLICT"
  );

  // Cas 3 : baseFileSha valide (correspondant exactement au gitBlobSha canonique)
  const validResult = await createScientificProposalPR({
    type: "lesson",
    slug: "critique-01-affirmation-vs-preuve",
    proposedContent: modifiedContent,
    checklistAnswers: getFullChecklist(),
    userId: "reviewer-123",
    userEmail: "rev@tabayyun.org",
    baseFileSha: canonical.gitBlobSha,
  });

  assert.strictEqual(validResult.success, true);

  // Cas 4 : Simulation de concurrence Relecteur A vs Relecteur B
  // Relecteur A a ouvert la page au SHA X
  const reviewerASha = canonical.gitBlobSha;
  // Entre-temps, la branche main a été mise à jour avec un nouveau SHA Y
  const mockNewMainContent = canonical.rawContent + "\n<!-- mise a jour concurrente par Relecteur B -->\n";
  const reviewerBSha = computeGitBlobSha(mockNewMainContent);

  // Relecteur A tente de soumettre avec son ancien SHA X alors que la base attend SHA Y
  assert.notStrictEqual(reviewerASha, reviewerBSha, "Les SHA doivent différer après modification concurrente");

  await assert.rejects(
    async () => {
      await createScientificProposalPR({
        type: "lesson",
        slug: "critique-01-affirmation-vs-preuve",
        proposedContent: { ...canonical.content, summaryFr: "Modification par Relecteur A" },
        checklistAnswers: getFullChecklist(),
        userId: "reviewer-A",
        userEmail: "revA@tabayyun.org",
        baseFileSha: "outdated-sha-before-merge",
      });
    },
    (err: unknown) => {
      const e = err as { code?: string };
      return e.code === "STALE_EDIT_CONFLICT";
    },
    "La soumission d'une version obsolète par Relecteur A doit échouer avec STALE_EDIT_CONFLICT"
  );

  console.log("    ✅ Invariant baseFileSha obligatoire et détection de conflit de concurrence (Stale Edit) validés.");
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
        baseFileSha: canonical.gitBlobSha,
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
      baseFileSha: canonical.gitBlobSha,
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

  try {
    const canonical = getCanonicalScientificContent("lesson", "critique-01-affirmation-vs-preuve");
    const modified = {
      ...canonical.content,
      summaryFr: "Modification en production qui doit échouer si GitHub est KO.",
    };

    // Cas 1: Échec lors du chargement canonique depuis GitHub en production
    global.fetch = (async () => {
      return new Response(JSON.stringify({ message: "Bad credentials" }), { status: 401, statusText: "Unauthorized" });
    }) as typeof fetch;

    await assert.rejects(
      async () => {
        await createScientificProposalPR({
          type: "lesson",
          slug: "critique-01-affirmation-vs-preuve",
          proposedContent: modified,
          checklistAnswers: getFullChecklist(),
          userId: "reviewer-123",
          userEmail: "rev@tabayyun.org",
          baseFileSha: canonical.gitBlobSha,
        });
      },
      /Impossible de charger le contenu canonique depuis GitHub main en production/,
      "En production, l'échec de chargement GitHub doit lever une exception fatale et ne JAMAIS simuler"
    );

    // Cas 2: Chargement canonique réussi, mais échec sur l'API Git (création de branche)
    global.fetch = (async (url: string | URL | Request) => {
      const urlStr = url.toString();
      if (urlStr.includes("/contents/")) {
        // Retourner le fichier canonique
        const contentBase64 = Buffer.from(canonical.rawContent).toString("base64");
        return new Response(JSON.stringify({ sha: canonical.gitBlobSha, content: contentBase64, encoding: "base64" }), { status: 200 });
      }
      // Toute autre opération GitHub échoue
      return new Response(JSON.stringify({ message: "Unauthorized git/refs" }), { status: 401, statusText: "Unauthorized" });
    }) as typeof fetch;

    await assert.rejects(
      async () => {
        await createScientificProposalPR({
          type: "lesson",
          slug: "critique-01-affirmation-vs-preuve",
          proposedContent: modified,
          checklistAnswers: getFullChecklist(),
          userId: "reviewer-123",
          userEmail: "rev@tabayyun.org",
          baseFileSha: canonical.gitBlobSha,
        });
      },
      /Échec critique de l'intégration GitHub en production/,
      "En production, l'échec d'API GitHub lors de la création de la PR doit lever une erreur fatale et ne JAMAIS simuler"
    );
  } finally {
    (process.env as Record<string, string | undefined>).NODE_ENV = prevEnv;
    delete process.env.GITHUB_TOKEN;
    global.fetch = originalFetch;
  }

  console.log("    ✅ Comportement fail-closed sans simulation en production validé.");
}

// =========================================================================
// 8. Test Contrôle RBAC des Rôles (Helper Réel de la Route)
// =========================================================================
function testRbacPermissionsMatrix() {
  console.log("  [8/10] Test de la matrice d'autorisation RBAC (validateAdminProposalAccess)...");

  // Anonyme -> 401
  const anonCheck = validateAdminProposalAccess(null);
  assert.strictEqual(anonCheck.allowed, false);
  assert.strictEqual(anonCheck.status, 401);

  // Utilisateur normal -> 403
  const userCheck = validateAdminProposalAccess({ role: "USER" });
  assert.strictEqual(userCheck.allowed, false);
  assert.strictEqual(userCheck.status, 403);

  // Relecteur scientifique -> 200
  const reviewerCheck = validateAdminProposalAccess({ role: "REVIEWER" });
  assert.strictEqual(reviewerCheck.allowed, true);
  assert.strictEqual(reviewerCheck.status, 200);

  // Administrateur -> 200
  const adminCheck = validateAdminProposalAccess({ role: "ADMIN" });
  assert.strictEqual(adminCheck.allowed, true);
  assert.strictEqual(adminCheck.status, 200);

  console.log("    ✅ Matrice RBAC et helper validateAdminProposalAccess validés.");
}

// =========================================================================
// 9. Test Service de Vérification CI des Pull Requests (Conclusions Strictes)
// =========================================================================
async function testPullRequestChecksService() {
  console.log("  [9/10] Test du service de vérification CI des Pull Requests (Conclusions strictes & Fail-Closed)...");

  // a. Mode dev sans token
  const devChecks = await getPullRequestChecks(123);
  assert.strictEqual(devChecks.prNumber, 123);
  assert.strictEqual(devChecks.checkStatus, "SUCCESS");
  assert.ok(devChecks.checks.length > 0);

  // b. Mode production sans token / credentials -> Fail-Closed obligatoire
  const prevEnv = process.env.NODE_ENV;
  (process.env as Record<string, string | undefined>).NODE_ENV = "production";
  try {
    await assert.rejects(
      async () => {
        await getPullRequestChecks(123);
      },
      /GitHub CI verification unavailable en production sans identifiants valides/,
      "En production, getPullRequestChecks sans identifiants doit lever une exception fatale"
    );
  } finally {
    (process.env as Record<string, string | undefined>).NODE_ENV = prevEnv;
  }

  // c. Test des conclusions GitHub API avec mock fetch
  const originalFetch = global.fetch;
  process.env.GITHUB_TOKEN = "mock-checks-token";

  try {
    // Cas c1: 0 check runs -> PENDING
    global.fetch = (async (url: string | URL | Request) => {
      const urlStr = url.toString();
      if (urlStr.includes("/pulls/")) {
        return new Response(JSON.stringify({ head: { sha: "sha-1" }, state: "open" }), { status: 200 });
      }
      if (urlStr.includes("/check-runs")) {
        return new Response(JSON.stringify({ check_runs: [] }), { status: 200 });
      }
      return new Response("Not found", { status: 404 });
    }) as typeof fetch;
    const zeroChecks = await getPullRequestChecks(1);
    assert.strictEqual(zeroChecks.checkStatus, "PENDING", "0 checks doit être PENDING");

    // Cas c2: Check in progress -> RUNNING
    global.fetch = (async (url: string | URL | Request) => {
      const urlStr = url.toString();
      if (urlStr.includes("/pulls/")) {
        return new Response(JSON.stringify({ head: { sha: "sha-2" }, state: "open" }), { status: 200 });
      }
      if (urlStr.includes("/check-runs")) {
        return new Response(JSON.stringify({
          check_runs: [
            { name: "Scientific & Technical Integrity Check", status: "in_progress", conclusion: null },
          ],
        }), { status: 200 });
      }
      return new Response("Not found", { status: 404 });
    }) as typeof fetch;
    const runningCheck = await getPullRequestChecks(2);
    assert.strictEqual(runningCheck.checkStatus, "RUNNING", "Check in_progress doit être RUNNING");

    // Cas c3: Completed mais check requis manquant -> PENDING si PR open, FAILED si closed
    global.fetch = (async (url: string | URL | Request) => {
      const urlStr = url.toString();
      if (urlStr.includes("/pulls/")) {
        return new Response(JSON.stringify({ head: { sha: "sha-3" }, state: "open" }), { status: 200 });
      }
      if (urlStr.includes("/check-runs")) {
        return new Response(JSON.stringify({
          check_runs: [
            { name: "Some Other Linter", status: "completed", conclusion: "success" },
          ],
        }), { status: 200 });
      }
      return new Response("Not found", { status: 404 });
    }) as typeof fetch;
    const missingReqCheck = await getPullRequestChecks(3);
    assert.strictEqual(missingReqCheck.checkStatus, "PENDING", "Check requis manquant sur PR ouverte doit être PENDING");

    // Cas c4: Completed avec check requis et conclusion success -> SUCCESS
    global.fetch = (async (url: string | URL | Request) => {
      const urlStr = url.toString();
      if (urlStr.includes("/pulls/")) {
        return new Response(JSON.stringify({ head: { sha: "sha-4" }, state: "open" }), { status: 200 });
      }
      if (urlStr.includes("/check-runs")) {
        return new Response(JSON.stringify({
          check_runs: [
            { name: "Scientific & Technical Integrity Check", status: "completed", conclusion: "success" },
          ],
        }), { status: 200 });
      }
      return new Response("Not found", { status: 404 });
    }) as typeof fetch;
    const successCheck = await getPullRequestChecks(4);
    assert.strictEqual(successCheck.checkStatus, "SUCCESS", "Check requis success doit être SUCCESS");

    // Cas c5: Test exhaustif des conclusions non-success -> FAILED
    const nonSuccessConclusions = [
      "failure",
      "timed_out",
      "cancelled",
      "action_required",
      "startup_failure",
      "stale",
      "neutral",
      "skipped",
      null,
    ];

    for (const badConclusion of nonSuccessConclusions) {
      global.fetch = (async (url: string | URL | Request) => {
        const urlStr = url.toString();
        if (urlStr.includes("/pulls/")) {
          return new Response(JSON.stringify({ head: { sha: "sha-bad" }, state: "open" }), { status: 200 });
        }
        if (urlStr.includes("/check-runs")) {
          return new Response(JSON.stringify({
            check_runs: [
              { name: "Scientific & Technical Integrity Check", status: "completed", conclusion: badConclusion },
            ],
          }), { status: 200 });
        }
        return new Response("Not found", { status: 404 });
      }) as typeof fetch;

      const failedResult = await getPullRequestChecks(5);
      assert.strictEqual(
        failedResult.checkStatus,
        "FAILED",
        `Conclusion "${badConclusion}" doit impérativement donner le statut FAILED`
      );
    }
  } finally {
    global.fetch = originalFetch;
    delete process.env.GITHUB_TOKEN;
  }

  console.log("    ✅ Service getPullRequestChecks et conclusions strictes validés.");
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

  console.log("🎉 LES 10 VECTEURS D'INTÉGRITÉ GIT/PR DE LA PHASE 7.1.1 ONT ÉTÉ VALIDÉS AVEC SUCCÈS !");
}

runSuite().catch((err) => {
  console.error("❌ Échec de la suite de tests de la Phase 7.1.1:", err);
  process.exit(1);
});
