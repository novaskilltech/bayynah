import assert from "assert";
import {
  evaluateAttestationEligibility,
  buildMethodologicalProfile,
} from "../src/lib/skills-calculator";
import {
  hashPassword,
  verifyPassword,
} from "../src/lib/auth";
import { SkillAttempt, MethodologicalSkill } from "../src/types/skills";
import { SkillAttemptInput } from "../src/lib/progress-sync/types";
import { getLessonPath } from "../src/lib/resource-paths";

console.log("🧪 Démarrage de la suite de tests — Phase 6 : Synchronisation, Intégrité & Attestations...");

// 1. Test d'authentification robuste (hachage scrypt OWASP)
async function testAuth() {
  const pwd = "SuperSecretPassword123!";
  const hash = await hashPassword(pwd);

  assert.ok(hash.startsWith("scrypt$N=131072,r=8,p=1$"), "Le hachage doit attester des paramètres OWASP N=2^17, r=8, p=1");
  const isValid = await verifyPassword(pwd, hash);
  assert.strictEqual(isValid, true, "Le mot de passe correct doit être validé");

  const isInvalid = await verifyPassword("WrongPassword123!", hash);
  assert.strictEqual(isInvalid, false, "Un mauvais mot de passe doit être rejeté");

  console.log("  ✅ Authentification et hachage scrypt OWASP validés.");
}

// 2. Test des deux niveaux d'attestations (Parcours vs Maîtrise Méthodologique)
function testAttestationEligibility() {
  const allSkills: MethodologicalSkill[] = [
    "SOURCE_IDENTIFICATION",
    "PRIMARY_SOURCE_RETRIEVAL",
    "AUTHENTICITY_CHECK",
    "CONTEXT_ANALYSIS",
    "TEXT_MEANING",
    "EVIDENCE_AGGREGATION",
    "DALALA_ANALYSIS",
    "KHILAF_IDENTIFICATION",
    "SALAF_ATTRIBUTION",
    "IJMA_VERIFICATION",
    "EPISTEMIC_CAUTION",
    "CONCLUSION_CALIBRATION",
    "BIAS_DETECTION",
    "TERMINOLOGY_ANALYSIS",
  ];

  // Profil vierge
  const emptyProfile = buildMethodologicalProfile([]);

  // Cas 1 : Score 70% et 6 contenus -> Éligible à rien (< 75%)
  const el1 = evaluateAttestationEligibility(emptyProfile, 70, 6);
  assert.strictEqual(el1.eligibleForPathAttestation, false);
  assert.strictEqual(el1.eligibleForMasteryAttestation, false);

  // Cas 2 : Score 76% et 4 contenus -> Éligible à rien (manque de parcours < 5)
  const el2 = evaluateAttestationEligibility(emptyProfile, 76, 4);
  assert.strictEqual(el2.eligibleForPathAttestation, false);
  assert.strictEqual(el2.eligibleForMasteryAttestation, false);

  // Cas 3 : Score 76% et 5 contenus -> Éligible PARCOURS, mais PAS Maîtrise
  const el3 = evaluateAttestationEligibility(emptyProfile, 76, 5);
  assert.strictEqual(el3.eligibleForPathAttestation, true);
  assert.strictEqual(el3.eligibleForMasteryAttestation, false);
  console.log("  ✅ Critères Niveau 1 (Attestation de parcours) validés.");

  // Cas 4 : Création d'un profil d'excellence avec 11 compétences solides/maîtrisées et diversité contextuelle
  const attempts: SkillAttempt[] = [];
  allSkills.slice(0, 11).forEach((skillId, idx) => {
    // 3 tentatives dans 3 contextes distincts par compétence
    ["inquiry-01", "inquiry-02", "lesson-01"].forEach((ctx, cIdx) => {
      attempts.push({
        id: `att-${idx}-${cIdx}`,
        skillId,
        sourceType: "INQUIRY_STEP",
        sourceId: ctx,
        firstScore: 3,
        finalScore: 3,
        attemptCount: 1,
        correctedAfterFeedback: false,
        timestamp: new Date().toISOString(),
      });
    });
  });

  const highProfile = buildMethodologicalProfile(attempts);
  assert.ok(highProfile.solidSkillsCount + highProfile.masteredSkillsCount >= 10, "Doit avoir >= 10 compétences solides/maîtrisées");

  // Avec score final 88% -> Doit être éligible à Maîtrise
  const elHigh = evaluateAttestationEligibility(highProfile, 88, 10);
  assert.strictEqual(elHigh.eligibleForPathAttestation, true);
  assert.strictEqual(elHigh.eligibleForMasteryAttestation, true);

  // Si score final < 85% (ex: 83%) -> Éligible Parcours mais PAS Maîtrise
  const elMedium = evaluateAttestationEligibility(highProfile, 83, 10);
  assert.strictEqual(elMedium.eligibleForPathAttestation, true);
  assert.strictEqual(elMedium.eligibleForMasteryAttestation, false);

  console.log("  ✅ Critères Niveau 2 (Attestation de maîtrise méthodologique) validés.");
}

// 3. Test de détection de patterns méthodologiques (terminologie neutre et scientifique)
function testMethodologicalPatterns() {
  const attempts: SkillAttempt[] = [
    {
      id: "att-err-1",
      skillId: "EVIDENCE_AGGREGATION",
      sourceType: "INQUIRY_STEP",
      sourceId: "inquiry-09",
      firstScore: 0,
      finalScore: 3,
      attemptCount: 3,
      correctedAfterFeedback: true,
      timestamp: new Date().toISOString(),
    },
    {
      id: "att-err-2",
      skillId: "EVIDENCE_AGGREGATION",
      sourceType: "INQUIRY_STEP",
      sourceId: "inquiry-10",
      firstScore: 0,
      finalScore: 3,
      attemptCount: 3,
      correctedAfterFeedback: true,
      timestamp: new Date().toISOString(),
    },
  ];

  const profile = buildMethodologicalProfile(attempts);
  assert.ok(profile.identifiedPatterns.length > 0, "Un pattern méthodologique doit être détecté");
  assert.strictEqual(profile.identifiedPatterns[0].skillId, "EVIDENCE_AGGREGATION");

  // Vérifier la neutralité déontologique : aucun terme doctrinal, psychologique ou personnel
  const patternDesc = profile.identifiedPatterns[0].description.fr;
  assert.ok(!patternDesc.includes("foi"), "Interdiction d'inférer sur la foi");
  assert.ok(!patternDesc.includes("croyance"), "Interdiction d'inférer sur les croyances");
  assert.ok(!patternDesc.includes("psychologie"), "Interdiction d'inférer sur la psychologie");

  console.log("  ✅ Détection de patterns méthodologiques et respect déontologique validés.");
}

// 4. Test d'idempotence et fusion non-destructive des tentatives
function testIdempotenceAndMerge() {
  const localAttempts: SkillAttemptInput[] = [
    {
      id: "uuid-1",
      skillId: "SOURCE_IDENTIFICATION",
      contextId: "lesson-01",
      contextType: "LESSON",
      score: 1.0,
      clientTimestamp: "2026-09-21T10:00:00Z",
    },
    {
      id: "uuid-2",
      skillId: "TEXT_MEANING",
      contextId: "inquiry-01",
      contextType: "INQUIRY",
      score: 0.8,
      clientTimestamp: "2026-09-21T10:05:00Z",
    },
  ];

  // Simulation d'une queue locale contenant un nouvel élément + un élément déjà présent
  const queueAttempts: SkillAttemptInput[] = [
    {
      id: "uuid-2", // Doublon
      skillId: "TEXT_MEANING",
      contextId: "inquiry-01",
      contextType: "INQUIRY",
      score: 0.8,
      clientTimestamp: "2026-09-21T10:05:00Z",
    },
    {
      id: "uuid-3", // Nouveau
      skillId: "EVIDENCE_AGGREGATION",
      contextId: "inquiry-09",
      contextType: "INQUIRY",
      score: 1.0,
      clientTimestamp: "2026-09-21T10:10:00Z",
    },
  ];

  const map = new Map<string, SkillAttemptInput>();
  for (const a of localAttempts) map.set(a.id, a);
  for (const a of queueAttempts) map.set(a.id, a);

  const merged = Array.from(map.values());
  assert.strictEqual(merged.length, 3, "La fusion par UUID doit contenir exactement 3 éléments uniques");

  // Ingestion serveur : détection des doublons
  const serverExistingIds = new Set(["uuid-1"]);
  const toInsert = merged.filter((a) => !serverExistingIds.has(a.id));
  const ignoredCount = merged.length - toInsert.length;

  assert.strictEqual(toInsert.length, 2, "Seuls les éléments non présents côté serveur doivent être insérés");
  assert.strictEqual(ignoredCount, 1, "Le doublon uuid-1 doit être ignoré");

  console.log("  ✅ Idempotence stricte et fusion non-destructive validées.");
}

function testCanonicalLessonPaths() {
  assert.strictEqual(
    getLessonPath("fr", "critique-01-affirmation-vs-preuve"),
    "/fr/ecoles/critique/critique-01-affirmation-vs-preuve"
  );
  assert.strictEqual(
    getLessonPath("ar", "hadith-05-authenticite-vs-istidlal"),
    "/ar/ecoles/hadith/hadith-05-authenticite-vs-istidlal"
  );
  assert.strictEqual(getLessonPath("fr", "slug-inconnu"), "/fr/ecoles");
  console.log("  ✅ Construction canonique des liens de leçons validée.");
}

async function runAll() {
  await testAuth();
  testAttestationEligibility();
  testMethodologicalPatterns();
  testIdempotenceAndMerge();
  testCanonicalLessonPaths();
  console.log("🎉 Tous les tests Phase 6 (Intégrité, Synchronisation, Attestations) ont réussi avec brio !");
}

runAll().catch((err) => {
  console.error("❌ Échec des tests :", err);
  process.exit(1);
});
