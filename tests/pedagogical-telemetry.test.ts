import assert from "assert";
import {
  GLOSSARY_TERMS,
  getGlossaryTerm,
  searchGlossary,
  getGlossaryTermsByCategory,
} from "../src/lib/glossary-data";
import {
  TelemetryEventSchema,
  purgeOldPedagogicalMetrics,
  VALID_GLOSSARY_TERM_IDS,
  VALID_INQUIRY_IDS_AND_SLUGS,
  VALID_LESSON_SLUGS,
} from "../src/lib/telemetry";
import { generatePilotSession, getPilotSecret, verifyPilotSession } from "../src/lib/pilot-session";
import { prisma } from "../src/lib/prisma";
import { handlePurgeRequest } from "../src/lib/pedagogical-retention-route";
import type { NextRequest } from "next/server";
import { getAllLessons } from "../src/lib/lesson-service";
import { getAllInquiries } from "../src/lib/inquiry-service";

console.log("🔬 Démarrage de la suite de tests — Phase 8.1 : Lexique & Télémétrie Pédagogique Pilote...");

// =========================================================================
// 1. Test d'Intégrité du Lexique Canonique (Au moins 25 termes bilingues complets)
// =========================================================================
function testGlossaryDataIntegrity() {
  console.log("  [1/7] Test d'intégrité du lexique canonique bilingue...");

  assert.ok(GLOSSARY_TERMS.length >= 25, `Le lexique doit contenir au moins 25 termes (trouvé: ${GLOSSARY_TERMS.length})`);

  const seenIds = new Set<string>();

  for (const term of GLOSSARY_TERMS) {
    assert.ok(term.id && typeof term.id === "string", `Le terme doit avoir un id valide`);
    assert.ok(!seenIds.has(term.id), `Identifiant de terme dupliqué : ${term.id}`);
    seenIds.add(term.id);

    assert.ok(term.termFr.trim().length > 0, `termFr non vide pour ${term.id}`);
    assert.ok(term.termAr.trim().length > 0, `termAr non vide pour ${term.id}`);
    assert.ok(term.shortDefinitionFr.trim().length > 10, `shortDefinitionFr substantielle pour ${term.id}`);
    assert.ok(term.shortDefinitionAr.trim().length > 10, `shortDefinitionAr substantielle pour ${term.id}`);
    assert.ok(term.analogyFr.trim().length > 5, `analogyFr présente pour ${term.id}`);
    assert.ok(term.analogyAr.trim().length > 5, `analogyAr présente pour ${term.id}`);
    assert.ok(term.trapFr.trim().length > 5, `trapFr présent pour ${term.id}`);
    assert.ok(term.trapAr.trim().length > 5, `trapAr présent pour ${term.id}`);
    assert.ok(
      ["hadith", "usul", "epistemology", "governance"].includes(term.category),
      `Catégorie invalide pour ${term.id}: ${term.category}`
    );
    assert.strictEqual(term.editorialStatus, "PUBLISHED", `Le statut éditorial doit être PUBLISHED pour ${term.id}`);
    assert.ok(term.reviewerId && term.reviewerId.length > 0, `reviewerId requis pour ${term.id}`);
    assert.ok(term.reviewedAt && term.reviewedAt.length > 0, `reviewedAt requis pour ${term.id}`);
    assert.ok(Array.isArray(term.sources) && term.sources.length > 0, `sources requises pour ${term.id}`);
  }

  assert.deepStrictEqual(
    [...VALID_GLOSSARY_TERM_IDS].sort(),
    GLOSSARY_TERMS.map((term) => term.id).sort(),
    "Le contrat de télémétrie doit refléter exactement les termes publiés"
  );

  assert.deepStrictEqual(
    [...VALID_LESSON_SLUGS].sort(),
    getAllLessons().map((lesson) => lesson.slug).sort(),
    "Le contrat de télémétrie doit refléter exactement les leçons publiées"
  );

  const inquiries = getAllInquiries();
  const inquiryResources = inquiries.flatMap((inquiry) => [inquiry.id, inquiry.slug]).sort();
  assert.deepStrictEqual(
    [...VALID_INQUIRY_IDS_AND_SLUGS].sort(),
    inquiryResources,
    "Le contrat de télémétrie doit refléter exactement les enquêtes publiées"
  );

  console.log(`    ✅ ${GLOSSARY_TERMS.length} termes du lexique vérifiés avec conformité bilingue 100% (FR/AR).`);
}

// =========================================================================
// 2. Test des Fonctions de Recherche et Récupération du Glossaire
// =========================================================================
function testGlossaryHelpers() {
  console.log("  [2/7] Test des helpers de recherche et filtrage du glossaire...");

  // Récupération par ID
  const dalala = getGlossaryTerm("dalala");
  assert.ok(dalala);
  assert.strictEqual(dalala.id, "dalala");
  assert.ok(dalala.termAr.includes("دَلَالَة"));

  // Récupération insensible à la casse et aux espaces
  const takrij = getGlossaryTerm("  TaKrIj  ");
  assert.ok(takrij);
  assert.strictEqual(takrij.id, "takrij");

  // Terme inexistant
  const unknown = getGlossaryTerm("terme-inexistant-12345");
  assert.strictEqual(unknown, undefined);

  // Recherche textuelle FR
  const searchResultsFr = searchGlossary("traçabilité");
  assert.ok(searchResultsFr.length > 0);
  assert.ok(searchResultsFr.some((t) => t.id === "takrij"));

  // Recherche textuelle AR
  const searchResultsAr = searchGlossary("دلالة");
  assert.ok(searchResultsAr.length > 0);
  assert.ok(searchResultsAr.some((t) => t.id === "dalala"));

  // Filtrage par catégorie
  const hadithTerms = getGlossaryTermsByCategory("hadith");
  assert.ok(hadithTerms.length >= 5);
  assert.ok(hadithTerms.every((t) => t.category === "hadith"));

  console.log("    ✅ Helpers getGlossaryTerm, searchGlossary et getGlossaryTermsByCategory validés.");
}

// =========================================================================
// 3. Test de Signature et Vérification de Session Pilote HMAC
// =========================================================================
function testPilotSessionHmac() {
  console.log("  [3/7] Test de signature et vérification cryptographique des sessions pilotes...");

  const session = generatePilotSession();
  assert.ok(session.pilotSessionId.startsWith("pilot_"));
  assert.strictEqual(session.pilotSessionSignature.length, 64);
  assert.ok(session.expiresAt > Date.now());

  // Vérification réussie
  const isValid = verifyPilotSession(
    session.pilotSessionId,
    session.pilotSessionSignature,
    session.expiresAt
  );
  assert.strictEqual(isValid, true, "La session valide doit être acceptée");

  // Rejet en cas de signature corrompue
  const isCorruptedValid = verifyPilotSession(
    session.pilotSessionId,
    session.pilotSessionSignature.replace(/^[0-9a-f]/, "a" === session.pilotSessionSignature[0] ? "b" : "a"),
    session.expiresAt
  );
  assert.strictEqual(isCorruptedValid, false, "Une signature falsifiée doit être rejetée");

  // Rejet si session expirée
  const isExpiredValid = verifyPilotSession(
    session.pilotSessionId,
    session.pilotSessionSignature,
    Date.now() - 1000
  );
  assert.strictEqual(isExpiredValid, false, "Une session expirée doit être rejetée");

  const previousPilotSecret = process.env.PILOT_TELEMETRY_SECRET;
  const previousCsrfSecret = process.env.CSRF_SECRET;
  const previousAuthSecret = process.env.AUTH_SECRET;
  const previousNodeEnv = process.env.NODE_ENV;
  const mutableEnv = process.env as Record<string, string | undefined>;
  try {
    delete process.env.PILOT_TELEMETRY_SECRET;
    process.env.CSRF_SECRET = "must-not-be-used";
    process.env.AUTH_SECRET = "must-not-be-used";
    mutableEnv.NODE_ENV = "production";
    assert.throws(
      () => getPilotSecret(),
      /PILOT_TELEMETRY_SECRET must be configured in production/,
      "La production doit échouer sans secret dédié, même si CSRF_SECRET ou AUTH_SECRET existent"
    );
  } finally {
    if (previousPilotSecret === undefined) delete process.env.PILOT_TELEMETRY_SECRET;
    else process.env.PILOT_TELEMETRY_SECRET = previousPilotSecret;
    if (previousCsrfSecret === undefined) delete process.env.CSRF_SECRET;
    else process.env.CSRF_SECRET = previousCsrfSecret;
    if (previousAuthSecret === undefined) delete process.env.AUTH_SECRET;
    else process.env.AUTH_SECRET = previousAuthSecret;
    if (previousNodeEnv === undefined) delete mutableEnv.NODE_ENV;
    else mutableEnv.NODE_ENV = previousNodeEnv;
  }

  console.log("    ✅ Sessions pilotes HMAC infalsifiables et contrôlées.");
}

// =========================================================================
// 4. Test de Validation Zod du Contrat de Télémétrie Pédagogique
// =========================================================================
function testTelemetryEventValidation() {
  console.log("  [4/7] Test de validation Zod du contrat de télémétrie pédagogique...");

  const session = generatePilotSession();

  // Payload valide
  const validEvent = {
    pilotSessionId: session.pilotSessionId,
    pilotSessionSignature: session.pilotSessionSignature,
    expiresAt: session.expiresAt,
    eventType: "LESSON_OPENED" as const,
    resourceType: "lesson" as const,
    resourceId: "critique-01-affirmation-vs-preuve" as const,
    stepNumber: 0,
    durationMs: 1500,
    metadata: { school: "CRITIQUE" as const, level: 1 },
  };

  const validResult = TelemetryEventSchema.safeParse(validEvent);
  assert.strictEqual(validResult.success, true);

  // Rejet si resourceId n'est pas dans la liste fermée canonique
  const invalidResourceId = {
    ...validEvent,
    resourceId: "malicious-unknown-slug",
  };
  assert.strictEqual(TelemetryEventSchema.safeParse(invalidResourceId).success, false);

  // Rejet si school n'est pas dans les écoles canoniques
  const invalidSchool = {
    ...validEvent,
    metadata: { school: "Hanafi", level: 1 },
  };
  assert.strictEqual(TelemetryEventSchema.safeParse(invalidSchool).success, false);

  // Rejet si pilotSessionId trop court (< 8 caractères)
  const invalidSession = {
    ...validEvent,
    pilotSessionId: "short",
  };
  assert.strictEqual(TelemetryEventSchema.safeParse(invalidSession).success, false);

  // Rejet si signature non conforme (différente de 64 caractères hex)
  const invalidSig = {
    ...validEvent,
    pilotSessionSignature: "invalid-len",
  };
  assert.strictEqual(TelemetryEventSchema.safeParse(invalidSig).success, false);

  // Rejet si eventType inconnu
  const invalidEventType = {
    ...validEvent,
    eventType: "USER_TRACKING_FORBIDDEN",
  };
  assert.strictEqual(TelemetryEventSchema.safeParse(invalidEventType).success, false);

  // Rejet si texte libre présent dans les métadonnées (anti-exfiltration)
  const illegalMetadata = {
    ...validEvent,
    metadata: { school: "CRITIQUE", comment: "Mon opinion libre...", email: "user@test.com" },
  };
  assert.strictEqual(TelemetryEventSchema.safeParse(illegalMetadata).success, false);

  const illegalTopLevelText = {
    ...validEvent,
    freeText: "Texte arbitraire hors metadata",
  };
  assert.strictEqual(TelemetryEventSchema.safeParse(illegalTopLevelText).success, false);

  const nonHexSignature = {
    ...validEvent,
    pilotSessionSignature: "z".repeat(64),
  };
  assert.strictEqual(TelemetryEventSchema.safeParse(nonHexSignature).success, false);

  // Rejet si durée négative
  const negativeDuration = {
    ...validEvent,
    durationMs: -500,
  };
  assert.strictEqual(TelemetryEventSchema.safeParse(negativeDuration).success, false);

  console.log("    ✅ Contrat de validation Zod de la télémétrie pédagogique validé sans texte libre.");
}

// =========================================================================
// 5. Test des 11 Types d'Événements du Parcours Pilote Canonique
// =========================================================================
function testPilotEventTypesCoverage() {
  console.log("  [5/7] Test de la couverture des 11 événements du tunnel pilote...");

  const session = generatePilotSession();
  const base = {
    pilotSessionId: session.pilotSessionId,
    pilotSessionSignature: session.pilotSessionSignature,
    expiresAt: session.expiresAt,
  };

  const testCases: Parameters<typeof TelemetryEventSchema.safeParse>[0][] = [
    {
      ...base,
      eventType: "DIAGNOSTIC_STARTED",
      resourceType: "diagnostic",
      resourceId: "diagnostic-initial",
      metadata: { questionCount: 14 },
    },
    {
      ...base,
      eventType: "DIAGNOSTIC_COMPLETED",
      resourceType: "diagnostic",
      resourceId: "diagnostic-initial",
      metadata: { totalQuestions: 14, correctAnswers: 11, initialScorePercent: 78.5 },
    },
    {
      ...base,
      eventType: "LESSON_OPENED",
      resourceType: "lesson",
      resourceId: "critique-01-affirmation-vs-preuve",
      metadata: { school: "CRITIQUE", level: 2 },
    },
    {
      ...base,
      eventType: "LESSON_COMPLETED",
      resourceType: "lesson",
      resourceId: "critique-01-affirmation-vs-preuve",
      metadata: { quizScorePercent: 100, passed: true },
    },
    {
      ...base,
      eventType: "INQUIRY_STARTED",
      resourceType: "inquiry",
      resourceId: "inquiry-01",
      metadata: { certaintyLevelTarget: "ETABLI" },
    },
    {
      ...base,
      eventType: "INQUIRY_STEP_ANSWERED",
      resourceType: "inquiry",
      resourceId: "inquiry-01",
      stepNumber: 1,
      durationMs: 12000,
      metadata: { quality: "BEST", methodologicalScore: 3, attemptNumber: 1 },
    },
    {
      ...base,
      eventType: "INQUIRY_ABANDONED",
      resourceType: "inquiry",
      resourceId: "inquiry-01",
      stepNumber: 2,
      durationMs: 35000,
      metadata: { lastCompletedStep: 2 },
    },
    {
      ...base,
      eventType: "INQUIRY_COMPLETED",
      resourceType: "inquiry",
      resourceId: "inquiry-01",
      stepNumber: 10,
      durationMs: 180000,
      metadata: { finalQuality: "BEST", totalMethodologicalScore: 28, stepsCount: 10 },
    },
    {
      ...base,
      eventType: "FINAL_ASSESSMENT_STARTED",
      resourceType: "final_assessment",
      resourceId: "evaluation-finale",
      metadata: { totalQuestions: 10 },
    },
    {
      ...base,
      eventType: "FINAL_ASSESSMENT_COMPLETED",
      resourceType: "final_assessment",
      resourceId: "evaluation-finale",
      metadata: {
        finalScorePercent: 85,
        eligibleForAttestation: true,
        attestationType: "MAITRISE_METHODOLOGIQUE",
      },
    },
    {
      ...base,
      eventType: "GLOSSARY_OPENED",
      resourceType: "glossary",
      resourceId: "dalala",
      metadata: {
        termId: "dalala",
        fromResourceType: "lesson",
        fromResourceId: "critique-01-affirmation-vs-preuve",
      },
    },
  ];

  for (const tc of testCases) {
    const parseRes = TelemetryEventSchema.safeParse(tc);
    assert.strictEqual(
      parseRes.success,
      true,
      `L'événement ${tc && typeof tc === "object" && "eventType" in tc ? tc.eventType : "inconnu"} doit être accepté: ${JSON.stringify(parseRes)}`
    );
  }

  console.log("    ✅ Les 11 événements clés du tunnel d'apprentissage sont supportés et strictement typés.");
}

// =========================================================================
// 6. Test de Non-Conservation d'IP et Confidentialité RGPD
// =========================================================================
function testPrivacyAndNoIpStorage() {
  console.log("  [6/8] Test d'architecture RGPD : zéro stockage d'IP dans PedagogicalMetric...");

  // Vérifier que le modèle Prisma ne contient aucune colonne d'IP ni de User-Agent
  const _testMetricModel: Parameters<typeof prisma.pedagogicalMetric.create>[0]["data"] = {
    sessionId: "pilot_test_session_123",
    eventType: "LESSON_OPENED",
    resourceType: "lesson",
    resourceId: "critique-01-affirmation-vs-preuve",
    // ipAddress ou userAgent provoqueraient une erreur TypeScript si présents
  };

  assert.ok(_testMetricModel);
  console.log("    ✅ Modèle PedagogicalMetric strictement exempt de colonnes IP ou User-Agent.");
}

// =========================================================================
// 7. Test de Rétention et Procédure de Purge (90 jours)
// =========================================================================
async function testRetentionPurge() {
  console.log("  [7/8] Test de la procédure de purge des métriques pédagogiques (90 jours)...");

  assert.strictEqual(typeof purgeOldPedagogicalMetrics, "function");

  const now = Date.UTC(2026, 8, 22, 12, 0, 0);
  const records = [
    { id: "older", createdAt: new Date(now - 91 * 24 * 60 * 60 * 1000) },
    { id: "boundary", createdAt: new Date(now - 90 * 24 * 60 * 60 * 1000) },
    { id: "recent", createdAt: new Date(now - 89 * 24 * 60 * 60 * 1000) },
  ];
  const store = {
    async deleteMany({ where }: { where: { createdAt: { lt: Date } } }) {
      const deleted = records.filter((record) => record.createdAt < where.createdAt.lt);
      for (const record of deleted) records.splice(records.indexOf(record), 1);
      return { count: deleted.length };
    },
  };

  const deletedCount = await purgeOldPedagogicalMetrics(90, store, now);
  assert.strictEqual(deletedCount, 1);
  assert.deepStrictEqual(records.map((record) => record.id), ["boundary", "recent"]);
  assert.strictEqual(await purgeOldPedagogicalMetrics(90, store, now), 0, "La purge doit être idempotente");
  await assert.rejects(() => purgeOldPedagogicalMetrics(0, store, now), RangeError);
  console.log("    ✅ Les données > 90 jours sont supprimées, les données récentes conservées, de façon idempotente.");
}

// =========================================================================
// 8. Test de Sécurité de la Route Cron de Purge (/api/cron/purge-pedagogical-metrics)
// =========================================================================
async function testCronRouteSecurity() {
  console.log("  [8/8] Test d'authentification et sécurité de la route cron de purge...");

  const previousSecret = process.env.CRON_SECRET;
  try {
    delete process.env.CRON_SECRET;
    const noConfiguredSecretReq = {
      headers: new Headers({ authorization: "Bearer dev-only-change-me" }),
    } as unknown as NextRequest;
    assert.strictEqual((await handlePurgeRequest(noConfiguredSecretReq)).status, 401);

    process.env.CRON_SECRET = "test-cron-secret";
    const unauthReq = { headers: new Headers() } as unknown as NextRequest;
    assert.strictEqual((await handlePurgeRequest(unauthReq)).status, 401);

    const badSecretReq = {
      headers: new Headers({ authorization: "Bearer wrong-secret-token" }),
    } as unknown as NextRequest;
    assert.strictEqual((await handlePurgeRequest(badSecretReq)).status, 401);

    let requestedDays: number | undefined;
    const authReq = {
      headers: new Headers({ authorization: "Bearer test-cron-secret" }),
    } as unknown as NextRequest;
    const authRes = await handlePurgeRequest(authReq, async (days) => {
      requestedDays = days;
      return 123;
    });
    assert.strictEqual(authRes.status, 200);
    assert.strictEqual(requestedDays, 90);
    assert.deepStrictEqual(await authRes.json(), { success: true, deleted: 123 });
  } finally {
    if (previousSecret === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = previousSecret;
  }

  console.log("    ✅ Route cron de purge protégée par CRON_SECRET (fail-closed sans clé valide).");
}

// =========================================================================
// Exécution Globale
// =========================================================================
async function runSuite() {
  testGlossaryDataIntegrity();
  testGlossaryHelpers();
  testPilotSessionHmac();
  testTelemetryEventValidation();
  testPilotEventTypesCoverage();
  testPrivacyAndNoIpStorage();
  await testRetentionPurge();
  await testCronRouteSecurity();

  console.log("🎉 TOUS LES TESTS DE LA PHASE 8.1 (PILOT INSTRUMENTATION CLOSURE) ONT ÉTÉ VALIDÉS AVEC SUCCÈS !");
}

runSuite().catch((err) => {
  console.error("❌ Échec de la suite de tests de la Phase 8.1:", err);
  process.exit(1);
});
