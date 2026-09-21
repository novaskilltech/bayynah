import assert from "assert";
import {
  calculateAttemptScore,
  computeSkillMastery,
  buildMethodologicalProfile,
} from "../src/lib/skills-calculator";
import { checkPrerequisites } from "../src/lib/learning-path";
import { getRecommendedReviews } from "../src/lib/adaptive-review";
import { SkillAttempt } from "../src/types/skills";

console.log("🧪 Démarrage de la suite de tests unitaires — Modèle de Compétences TABAYYUN...");

// 1. Test de la formule de calcul non-linéaire (BEST immédiat vs auto-correction)
{
  const bestImmediate: SkillAttempt = {
    id: "att-1",
    skillId: "EVIDENCE_AGGREGATION",
    sourceType: "INQUIRY_STEP",
    sourceId: "inquiry-09",
    firstScore: 3,
    finalScore: 3,
    attemptCount: 1,
    correctedAfterFeedback: false,
    timestamp: "2026-09-21T10:00:00Z",
  };

  const prematureThenBest: SkillAttempt = {
    id: "att-2",
    skillId: "EVIDENCE_AGGREGATION",
    sourceType: "INQUIRY_STEP",
    sourceId: "inquiry-09",
    firstScore: 1,
    finalScore: 3,
    attemptCount: 2,
    correctedAfterFeedback: true,
    timestamp: "2026-09-21T10:05:00Z",
  };

  const incorrectThenBest: SkillAttempt = {
    id: "att-3",
    skillId: "EVIDENCE_AGGREGATION",
    sourceType: "INQUIRY_STEP",
    sourceId: "inquiry-09",
    firstScore: 0,
    finalScore: 3,
    attemptCount: 3,
    correctedAfterFeedback: true,
    timestamp: "2026-09-21T10:10:00Z",
  };

  const scoreBest = calculateAttemptScore(bestImmediate);
  const scorePremature = calculateAttemptScore(prematureThenBest);
  const scoreIncorrect = calculateAttemptScore(incorrectThenBest);

  assert.strictEqual(scoreBest, 100, "BEST immédiat doit valoir 100");
  assert.strictEqual(scorePremature, 40, "PREMATURE puis BEST doit valoir 40");
  assert.strictEqual(scoreIncorrect, 20, "INCORRECT répété puis BEST doit valoir 20");

  assert.ok(
    scoreBest > scorePremature && scorePremature > scoreIncorrect,
    "Invariant non-linéaire : BEST immédiat > auto-correction prématurée > correction après erreurs répétées"
  );
  console.log("  ✅ Invariant non-linéaire de scoring validé.");
}

// 2. Test de l'exigence de diversité contextuelle pour MASTERED
{
  // Cas A : 3 réussites sur la même source (contexte unique) -> Ne doit PAS être MASTERED
  const singleContextAttempts: SkillAttempt[] = [
    {
      id: "att-a1",
      skillId: "AUTHENTICITY_CHECK",
      sourceType: "INQUIRY_STEP",
      sourceId: "inquiry-02",
      stepNumber: 3,
      firstScore: 3,
      finalScore: 3,
      attemptCount: 1,
      correctedAfterFeedback: false,
      timestamp: "2026-09-21T11:00:00Z",
    },
    {
      id: "att-a2",
      skillId: "AUTHENTICITY_CHECK",
      sourceType: "INQUIRY_STEP",
      sourceId: "inquiry-02",
      stepNumber: 4,
      firstScore: 3,
      finalScore: 3,
      attemptCount: 1,
      correctedAfterFeedback: false,
      timestamp: "2026-09-21T11:05:00Z",
    },
    {
      id: "att-a3",
      skillId: "AUTHENTICITY_CHECK",
      sourceType: "INQUIRY_STEP",
      sourceId: "inquiry-02",
      stepNumber: 5,
      firstScore: 3,
      finalScore: 3,
      attemptCount: 1,
      correctedAfterFeedback: false,
      timestamp: "2026-09-21T11:10:00Z",
    },
  ];

  const masterySingle = computeSkillMastery("AUTHENTICITY_CHECK", singleContextAttempts);
  assert.strictEqual(masterySingle.scorePercentage, 100);
  assert.strictEqual(masterySingle.distinctContextsCount, 1);
  assert.strictEqual(
    masterySingle.level,
    "SOLID",
    "Une compétence sans diversité contextuelle (distinctContexts < 3) doit être limitée à SOLID même avec 100% de score"
  );

  // Cas B : 3 réussites sur 3 sources différentes -> Doit être MASTERED
  const multiContextAttempts: SkillAttempt[] = [
    {
      ...singleContextAttempts[0],
      sourceId: "inquiry-02",
    },
    {
      ...singleContextAttempts[1],
      sourceId: "inquiry-03",
    },
    {
      ...singleContextAttempts[2],
      sourceId: "lesson-h01",
    },
  ];

  const masteryMulti = computeSkillMastery("AUTHENTICITY_CHECK", multiContextAttempts);
  assert.strictEqual(masteryMulti.distinctContextsCount, 3);
  assert.strictEqual(masteryMulti.level, "MASTERED", "Avec 3 contextes distincts et >85%, la compétence est MASTERED");
  console.log("  ✅ Règle de diversité contextuelle pour le statut MASTERED validée.");
}

// 3. Test de détection de biais et recommandations adaptatives
{
  const profileWithBiases = buildMethodologicalProfile([
    {
      id: "att-b1",
      skillId: "EVIDENCE_AGGREGATION",
      sourceType: "INQUIRY_STEP",
      sourceId: "inquiry-09",
      stepNumber: 4,
      firstScore: 0,
      finalScore: 3,
      attemptCount: 3,
      correctedAfterFeedback: true,
      timestamp: "2026-09-21T12:00:00Z",
    },
    {
      id: "att-b2",
      skillId: "EVIDENCE_AGGREGATION",
      sourceType: "INQUIRY_STEP",
      sourceId: "inquiry-06",
      stepNumber: 5,
      firstScore: 0,
      finalScore: 3,
      attemptCount: 3,
      correctedAfterFeedback: true,
      timestamp: "2026-09-21T12:10:00Z",
    },
  ]);

  assert.ok(profileWithBiases.identifiedBiases.length > 0, "Un biais méthodologique doit être détecté");
  assert.strictEqual(profileWithBiases.identifiedBiases[0].skillId, "EVIDENCE_AGGREGATION");

  const reviews = getRecommendedReviews(profileWithBiases);
  assert.ok(reviews.length > 0, "Une recommandation de révision adaptative doit être générée");
  assert.strictEqual(reviews[0].skillId, "EVIDENCE_AGGREGATION");
  assert.strictEqual(reviews[0].urgency, "HIGH");
  assert.ok(reviews[0].recommendedLessons.length > 0, "Des leçons de révision doivent être recommandées");
  console.log("  ✅ Détection de biais et moteur de révision adaptative validés.");
}

// 4. Test des prérequis indicatifs non-bloquants
{
  // Test sur E05 (Consensus zakāt des bijoux) sans avoir fait F03
  const prereqCheck1 = checkPrerequisites([], [], "ijma-zakat-bijoux");
  assert.strictEqual(prereqCheck1.hasUnmetPrerequisites, true);
  assert.ok(prereqCheck1.missingLessons.includes("fiqh-03-ijma-jumhur-khilaf"));

  // Avec les prérequis complétés
  const prereqCheck2 = checkPrerequisites(
    ["critique-02-hierarchie-sources", "fiqh-03-ijma-jumhur-khilaf", "fiqh-05-reunir-preuves"],
    [],
    "ijma-zakat-bijoux"
  );
  assert.strictEqual(prereqCheck2.hasUnmetPrerequisites, false);
  console.log("  ✅ Vérification des prérequis indicatifs validée.");
}

console.log("🎉 Tous les tests unitaires du Modèle de Compétences TABAYYUN ont réussi avec succès !");
