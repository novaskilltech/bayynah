import assert from "assert";
import { generatePilotSession, verifyPilotSession } from "../src/lib/pilot-session";
import { TelemetryEventSchema } from "../src/lib/telemetry";

console.log("🚀 Démarrage de la suite de tests — Phase 8.1 : Pilot Funnel Integration & Security Invariants...");

// =========================================================================
// 1. Cycle de vie des sessions signées HMAC
// =========================================================================
function testSessionLifecycle() {
  console.log("  [1/4] Test du cycle de vie des sessions signées HMAC...");

  const session = generatePilotSession(60 * 1000); // 1 minute TTL
  assert.ok(session.pilotSessionId.startsWith("pilot_"));
  assert.strictEqual(session.pilotSessionSignature.length, 64);

  // Validation immédiate
  const valid = verifyPilotSession(session.pilotSessionId, session.pilotSessionSignature, session.expiresAt);
  assert.strictEqual(valid, true, "Session fraîchement générée doit être valide");

  // Rejet avec signature altérée
  const tamperedSig = session.pilotSessionSignature.substring(0, 63) + (session.pilotSessionSignature[63] === "a" ? "b" : "a");
  const tamperedValid = verifyPilotSession(session.pilotSessionId, tamperedSig, session.expiresAt);
  assert.strictEqual(tamperedValid, false, "Signature altérée doit être rejetée");

  // Rejet avec sessionId altéré
  const tamperedIdValid = verifyPilotSession(session.pilotSessionId + "_fake", session.pilotSessionSignature, session.expiresAt);
  assert.strictEqual(tamperedIdValid, false, "SessionId altéré doit être rejeté");

  // Rejet si expiration dans le passé
  const expiredValid = verifyPilotSession(session.pilotSessionId, session.pilotSessionSignature, Date.now() - 5000);
  assert.strictEqual(expiredValid, false, "Session expirée doit être rejetée");

  console.log("    ✅ Invariants cryptographiques des sessions pilotes vérifiés.");
}

// =========================================================================
// 2. Simulation complète du Funnel Pilote (Diagnostic -> Leçons -> Enquête -> Évaluation)
// =========================================================================
function testFunnelFlowSimulation() {
  console.log("  [2/4] Simulation du tunnel complet (11 événements ordonnés)...");

  const session = generatePilotSession();
  const base = {
    pilotSessionId: session.pilotSessionId,
    pilotSessionSignature: session.pilotSessionSignature,
    expiresAt: session.expiresAt,
  };

  // Étape 1 : Démarrage du diagnostic
  const diagStart = TelemetryEventSchema.safeParse({
    ...base,
    eventType: "DIAGNOSTIC_STARTED",
    resourceType: "diagnostic",
    resourceId: "diagnostic-initial",
    metadata: { questionCount: 14 },
  });
  assert.strictEqual(diagStart.success, true);

  // Étape 2 : Fin du diagnostic
  const diagComplete = TelemetryEventSchema.safeParse({
    ...base,
    eventType: "DIAGNOSTIC_COMPLETED",
    resourceType: "diagnostic",
    resourceId: "diagnostic-initial",
    metadata: { totalQuestions: 14, correctAnswers: 12, initialScorePercent: 85.7 },
  });
  assert.strictEqual(diagComplete.success, true);

  // Étape 3 : Ouverture d'une leçon
  const lessonOpen = TelemetryEventSchema.safeParse({
    ...base,
    eventType: "LESSON_OPENED",
    resourceType: "lesson",
    resourceId: "critique-01-affirmation-vs-preuve",
    metadata: { school: "CRITIQUE", level: 1 },
  });
  assert.strictEqual(lessonOpen.success, true);

  // Étape 4 : Consultation du lexique depuis la leçon
  const glossaryOpen = TelemetryEventSchema.safeParse({
    ...base,
    eventType: "GLOSSARY_OPENED",
    resourceType: "glossary",
    resourceId: "dalala",
    metadata: {
      termId: "dalala",
      fromResourceType: "lesson",
      fromResourceId: "critique-01-affirmation-vs-preuve",
    },
  });
  assert.strictEqual(glossaryOpen.success, true);

  // Étape 5 : Complétion de la leçon
  const lessonComplete = TelemetryEventSchema.safeParse({
    ...base,
    eventType: "LESSON_COMPLETED",
    resourceType: "lesson",
    resourceId: "critique-01-affirmation-vs-preuve",
    metadata: { quizScorePercent: 100, passed: true },
  });
  assert.strictEqual(lessonComplete.success, true);

  // Étape 6 : Démarrage de l'enquête (JAMAIS LESSON_OPENED pour une enquête)
  const inquiryStart = TelemetryEventSchema.safeParse({
    ...base,
    eventType: "INQUIRY_STARTED",
    resourceType: "inquiry",
    resourceId: "inquiry-01",
    metadata: { certaintyLevelTarget: "ETABLI" },
  });
  assert.strictEqual(inquiryStart.success, true);

  // Étape 7 : Réponse à une étape d'enquête
  const inquiryStep = TelemetryEventSchema.safeParse({
    ...base,
    eventType: "INQUIRY_STEP_ANSWERED",
    resourceType: "inquiry",
    resourceId: "inquiry-01",
    stepNumber: 1,
    durationMs: 8500,
    metadata: { quality: "BEST", methodologicalScore: 3, attemptNumber: 1 },
  });
  assert.strictEqual(inquiryStep.success, true);

  // Étape 8 : Complétion de l'enquête
  const inquiryComplete = TelemetryEventSchema.safeParse({
    ...base,
    eventType: "INQUIRY_COMPLETED",
    resourceType: "inquiry",
    resourceId: "inquiry-01",
    stepNumber: 10,
    durationMs: 145000,
    metadata: { finalQuality: "BEST", totalMethodologicalScore: 29, stepsCount: 10 },
  });
  assert.strictEqual(inquiryComplete.success, true);

  // Étape 9 : Démarrage de l'évaluation finale
  const evalStart = TelemetryEventSchema.safeParse({
    ...base,
    eventType: "FINAL_ASSESSMENT_STARTED",
    resourceType: "final_assessment",
    resourceId: "evaluation-finale",
    metadata: { totalQuestions: 10 },
  });
  assert.strictEqual(evalStart.success, true);

  // Étape 10 : Complétion de l'évaluation finale avec attestation
  const evalComplete = TelemetryEventSchema.safeParse({
    ...base,
    eventType: "FINAL_ASSESSMENT_COMPLETED",
    resourceType: "final_assessment",
    resourceId: "evaluation-finale",
    metadata: {
      finalScorePercent: 90,
      eligibleForAttestation: true,
      attestationType: "MAITRISE_METHODOLOGIQUE",
    },
  });
  assert.strictEqual(evalComplete.success, true);

  console.log("    ✅ Enchaînement des 10 étapes du funnel validé sans rupture.");
}

// =========================================================================
// 3. Robustesse contre les abandons intempestifs et faux positifs
// =========================================================================
function testInquiryAbandonReliability() {
  console.log("  [3/4] Test de la fiabilité de l'abandon d'enquête...");

  const session = generatePilotSession();

  // Abandon valide : étape > 0
  const validAbandon = TelemetryEventSchema.safeParse({
    pilotSessionId: session.pilotSessionId,
    pilotSessionSignature: session.pilotSessionSignature,
    expiresAt: session.expiresAt,
    eventType: "INQUIRY_ABANDONED",
    resourceType: "inquiry",
    resourceId: "inquiry-01",
    stepNumber: 3,
    durationMs: 45000,
    metadata: { lastCompletedStep: 3 },
  });
  assert.strictEqual(validAbandon.success, true);

  // Rejet si durationMs est négatif
  const negativeDuration = TelemetryEventSchema.safeParse({
    pilotSessionId: session.pilotSessionId,
    pilotSessionSignature: session.pilotSessionSignature,
    expiresAt: session.expiresAt,
    eventType: "INQUIRY_ABANDONED",
    resourceType: "inquiry",
    resourceId: "inquiry-01",
    stepNumber: 1,
    durationMs: -100,
  });
  assert.strictEqual(negativeDuration.success, false);

  console.log("    ✅ Abandon d'enquête immunisé contre les valeurs invalides.");
}

// =========================================================================
// 4. Éradication totale du texte libre et PII
// =========================================================================
function testZeroFreeTextStrictness() {
  console.log("  [4/4] Test d'éradication du texte libre et des métadonnées arbitraires...");

  const session = generatePilotSession();
  const base = {
    pilotSessionId: session.pilotSessionId,
    pilotSessionSignature: session.pilotSessionSignature,
    expiresAt: session.expiresAt,
  };

  const forbiddenPayloads = [
    {
      ...base,
      eventType: "DIAGNOSTIC_COMPLETED",
      resourceType: "diagnostic",
      resourceId: "diagnostic-initial",
      metadata: {
        totalQuestions: 14,
        correctAnswers: 10,
        initialScorePercent: 71.4,
        userNotes: "J'ai hésité sur la question 3", // Champ interdit !
      },
    },
    {
      ...base,
      eventType: "INQUIRY_STEP_ANSWERED",
      resourceType: "inquiry",
      resourceId: "inquiry-01",
      stepNumber: 1,
      metadata: {
        quality: "BEST",
        methodologicalScore: 3,
        attemptNumber: 1,
        feedbackComment: "Super question", // Champ interdit !
      },
    },
    {
      ...base,
      eventType: "FINAL_ASSESSMENT_COMPLETED",
      resourceType: "final_assessment",
      resourceId: "evaluation-finale",
      metadata: {
        finalScorePercent: 80,
        eligibleForAttestation: true,
        userName: "Ahmed", // Champ interdit !
      },
    },
    {
      ...base,
      eventType: "LESSON_OPENED",
      resourceType: "lesson",
      resourceId: "unlisted-lesson-slug", // Slug interdit !
      metadata: { school: "CRITIQUE", level: 1 },
    },
    {
      ...base,
      eventType: "LESSON_OPENED",
      resourceType: "lesson",
      resourceId: "critique-01-affirmation-vs-preuve",
      metadata: { school: "Maliki", level: 1 }, // École non canonique interdite !
    },
    {
      ...base,
      eventType: "INQUIRY_STARTED",
      resourceType: "inquiry",
      resourceId: "inquiry-01",
      metadata: { certaintyLevelTarget: "NON_CANONIQUE" }, // Niveau de certitude non canonique interdit !
    },
    {
      ...base,
      eventType: "GLOSSARY_OPENED",
      resourceType: "glossary",
      resourceId: "terme-inconnu-123", // Terme inconnu interdit !
      metadata: { termId: "terme-inconnu-123" },
    },
    {
      ...base,
      eventType: "GLOSSARY_OPENED",
      resourceType: "glossary",
      resourceId: "dalala",
      metadata: { termId: "dalala", fromResourceType: "lesson", fromResourceId: "/fr/lecons/page-pirate" }, // fromResourceId libre interdit !
    },
    {
      ...base,
      eventType: "GLOSSARY_OPENED",
      resourceType: "glossary",
      resourceId: "dalala",
      metadata: { termId: "takrij" }, // termId doit correspondre à resourceId
    },
    {
      ...base,
      eventType: "GLOSSARY_OPENED",
      resourceType: "glossary",
      resourceId: "dalala",
      metadata: { termId: "dalala", fromResourceType: "lesson", fromResourceId: "inquiry-01" },
    },
    {
      ...base,
      eventType: "LESSON_OPENED",
      resourceType: "lesson",
      resourceId: "critique-01-affirmation-vs-preuve",
      metadata: { school: "CRITIQUE" },
      arbitraryText: "champ racine interdit",
    },
  ];

  for (const fp of forbiddenPayloads) {
    const parseRes = TelemetryEventSchema.safeParse(fp);
    assert.strictEqual(
      parseRes.success,
      false,
      `Le payload contenant du texte libre ou un champ non déclaré doit être rejeté: ${JSON.stringify(fp)}`
    );
  }

  console.log("    ✅ Éradication stricte des champs libres et PII confirmée.");
}

// =========================================================================
// Exécution Globale
// =========================================================================
async function runSuite() {
  testSessionLifecycle();
  testFunnelFlowSimulation();
  testInquiryAbandonReliability();
  testZeroFreeTextStrictness();

  console.log("🎉 TOUS LES TESTS DE PILOT-FUNNEL ONT ÉTÉ VALIDÉS AVEC SUCCÈS !");
}

runSuite().catch((err) => {
  console.error("❌ Échec de la suite de tests pilot-funnel:", err);
  process.exit(1);
});
