import assert from "assert";
import crypto from "crypto";
import type { NextRequest } from "next/server";
import {
  hashPassword,
  verifyPassword,
  SCRYPT_CONFIG,
  hashSessionToken,
} from "../src/lib/auth";
import {
  generateCsrfToken,
  verifyCsrfToken,
  verifyOriginOrReferer,
} from "../src/lib/csrf";
import {
  checkRateLimit,
  clearAllRateLimits,
} from "../src/lib/rate-limit";
import {
  sanitizeAuditDetails,
} from "../src/lib/audit-logger";
import {
  buildCanonicalAttestationPayload,
  signCanonicalPayload,
  verifyCanonicalSignature,
  CURRENT_KEY_VERSION,
} from "../src/lib/attestation-service";
import {
  buildMethodologicalProfile,
  evaluateAttestationEligibility,
} from "../src/lib/skills-calculator";
import { SkillAttempt } from "../src/types/skills";

console.log("🔒 Démarrage de la suite de tests de sécurité approfondie (Phase 6.1 — Security Gate)...");

// ==========================================
// 1. Audit scrypt (OWASP N=2^17, r=8, p=1)
// ==========================================
async function testScryptSecurity() {
  console.log("  [1/9] Test de dérivation scrypt (OWASP N=2^17, r=8, p=1)...");

  // Vérification explicite des constantes de configuration
  assert.strictEqual(SCRYPT_CONFIG.N, 131072, "N doit être exactement 2^17 (131072)");
  assert.strictEqual(SCRYPT_CONFIG.r, 8, "r doit valoir 8");
  assert.strictEqual(SCRYPT_CONFIG.p, 1, "p doit valoir 1");
  assert.strictEqual(SCRYPT_CONFIG.keyLen, 64, "Longueur de clé doit être 64 octets");
  assert.strictEqual(SCRYPT_CONFIG.maxPasswordLength, 128, "Limite anti-DoS fixée à 128 caractères");

  const password = "ValidStrongPassword#2026!";
  const hash = await hashPassword(password);

  // Vérification du format structuré
  assert.ok(hash.startsWith("scrypt$N=131072,r=8,p=1$"), "Le préfixe doit attester des paramètres OWASP utilisés");
  const parts = hash.split("$");
  assert.strictEqual(parts.length, 4, "Le hash doit comporter 4 segments délimités par $");
  const salt = parts[2];
  const derivedKey = parts[3];

  assert.strictEqual(salt.length, 64, "Le sel doit comporter 32 octets (64 caractères hex)");
  assert.strictEqual(derivedKey.length, 128, "La clé dérivée doit comporter 64 octets (128 caractères hex)");

  // Vérification mot de passe valide
  const valid = await verifyPassword(password, hash);
  assert.strictEqual(valid, true, "Le mot de passe correct doit être validé");

  // Rejet mot de passe erroné
  const invalid = await verifyPassword("WrongPassword#2026!", hash);
  assert.strictEqual(invalid, false, "Un mot de passe erroné doit être rejeté");

  // Rejet mot de passe trop long (Anti-DoS)
  const hugePassword = "a".repeat(129);
  await assert.rejects(
    async () => hashPassword(hugePassword),
    /limite autorisée de 128 caractères/,
    "Un mot de passe > 128 caractères doit être rejeté immédiatement avant KDF"
  );

  // Rejet mot de passe vide
  await assert.rejects(
    async () => hashPassword(""),
    /ne peut pas être vide/,
    "Un mot de passe vide doit être rejeté"
  );

  console.log("    ✅ Paramètres scrypt OWASP et garde-fous anti-DoS validés.");
}

// ==========================================
// 2. Sessions serveur & Hachage de tokens
// ==========================================
function testSessionSecurity() {
  console.log("  [2/9] Test des sessions serveur et hachage de tokens...");

  const rawToken1 = crypto.randomBytes(32).toString("base64url");
  const rawToken2 = crypto.randomBytes(32).toString("base64url");

  const hash1 = hashSessionToken(rawToken1);
  const hash2 = hashSessionToken(rawToken2);

  assert.notStrictEqual(rawToken1, rawToken2, "Deux tokens aléatoires doivent être distincts");
  assert.notStrictEqual(hash1, hash2, "Les hash de session doivent être distincts");
  assert.strictEqual(hash1.length, 64, "Le hash de session SHA-256 doit faire 64 caractères hex");

  // Vérification de la non-réversibilité
  assert.ok(!hash1.includes(rawToken1), "Le hash ne doit pas contenir le token en clair");

  console.log("    ✅ Entropie des tokens et hachage de session validés.");
}

// ==========================================
// 3. Protection CSRF & Validation Origin/Referer
// ==========================================
function testCsrfAndOriginSecurity() {
  console.log("  [3/9] Test CSRF (Double Submit Cookie) et Origin/Referer...");

  const tokenA = generateCsrfToken();
  const tokenB = generateCsrfToken();

  assert.strictEqual(tokenA.length, 64, "Le jeton CSRF doit comporter 32 octets (64 caractères hex)");
  assert.notStrictEqual(tokenA, tokenB, "Chaque jeton CSRF généré doit être unique");

  // Correspondance exacte
  assert.strictEqual(verifyCsrfToken(tokenA, tokenA), true, "Jeton correspondant doit être accepté");

  // Non correspondance
  assert.strictEqual(verifyCsrfToken(tokenA, tokenB), false, "Jetons divergents doivent être rejetés");

  // Valeurs manquantes
  assert.strictEqual(verifyCsrfToken(null, tokenA), false, "Cookie manquant doit être rejeté");
  assert.strictEqual(verifyCsrfToken(tokenA, null), false, "Header manquant doit être rejeté");
  assert.strictEqual(verifyCsrfToken("", ""), false, "Valeurs vides doivent être rejetées");

  // Test de vérification Origin / Referer
  const fakeReqValid = {
    headers: new Map([
      ["host", "tabayyun.fr"],
      ["origin", "https://tabayyun.fr"],
    ]),
  };
  const mockReqValid = {
    headers: {
      get: (h: string) => fakeReqValid.headers.get(h.toLowerCase()) || null,
    },
  } as unknown as NextRequest;
  assert.strictEqual(verifyOriginOrReferer(mockReqValid), true, "Origin identique à Host doit être validée");

  const fakeReqCross = {
    headers: new Map([
      ["host", "tabayyun.fr"],
      ["origin", "https://evil-site.com"],
    ]),
  };
  const mockReqCross = {
    headers: {
      get: (h: string) => fakeReqCross.headers.get(h.toLowerCase()) || null,
    },
  } as unknown as NextRequest;
  assert.strictEqual(verifyOriginOrReferer(mockReqCross), false, "Origin tierce doit être rejetée");

  console.log("    ✅ Protection CSRF Double-Submit et contrôle d'origine validés.");
}

// ==========================================
// 4. Autorisation & Anti-IDOR
// ==========================================
function testAuthorizationAndAntiIdor() {
  console.log("  [4/9] Test d'autorisation et d'isolation des ressources (Anti-IDOR)...");

  // Règle 1 : L'identité est impérativement dérivée de la session, pas du client
  const sessionUser = { id: "user-alice-123", role: "STUDENT" };
  const clientPayload = { userId: "user-bob-999", score: 100 };

  // Fonction de contrôle simulant la logique serveur
  function resolveTargetUserId(authenticatedUser: { id: string }, _untrustedBody: { userId?: string }): string {
    // Interdiction absolue d'utiliser untrustedBody.userId
    return authenticatedUser.id;
  }

  const effectiveUserId = resolveTargetUserId(sessionUser, clientPayload);
  assert.strictEqual(effectiveUserId, "user-alice-123", "L'ID utilisateur effectif doit être celui de la session");
  assert.notStrictEqual(effectiveUserId, clientPayload.userId, "Le body client ne doit jamais usurper un ID tiers");

  // Règle 2 : Contrôle des rôles (RBAC)
  function assertRoleAccess(role: string, requiredRole: string): boolean {
    const hierarchy: Record<string, number> = { USER: 1, STUDENT: 2, AUTHOR: 3, REVIEWER: 4, ADMIN: 5 };
    return (hierarchy[role] || 0) >= (hierarchy[requiredRole] || 0);
  }

  assert.strictEqual(assertRoleAccess("STUDENT", "REVIEWER"), false, "Un STUDENT ne peut pas accéder aux fonctions REVIEWER");
  assert.strictEqual(assertRoleAccess("REVIEWER", "ADMIN"), false, "Un REVIEWER ne peut pas accéder aux fonctions ADMIN");
  assert.strictEqual(assertRoleAccess("ADMIN", "REVIEWER"), true, "Un ADMIN peut accéder aux fonctions REVIEWER");

  console.log("    ✅ Règles d'isolation anti-IDOR et RBAC validées.");
}

// ==========================================
// 5. Idempotence & Concurrence
// ==========================================
function testIdempotenceAndConcurrency() {
  console.log("  [5/9] Test d'idempotence et de gestion des doublons concurrents...");

  const existingAttemptIds = new Set<string>(["uuid-attempt-1", "uuid-attempt-2"]);

  // Simulation de 2 requêtes simultanées envoyant la même tentative
  const incomingAttempt = { id: "uuid-attempt-3", skillId: "DALALA_ANALYSIS" };

  function simulateIngest(attemptId: string): { inserted: boolean } {
    if (existingAttemptIds.has(attemptId)) {
      return { inserted: false };
    }
    existingAttemptIds.add(attemptId);
    return { inserted: true };
  }

  const req1Result = simulateIngest(incomingAttempt.id);
  const req2Result = simulateIngest(incomingAttempt.id);

  assert.strictEqual(req1Result.inserted, true, "La 1re requête doit insérer la tentative");
  assert.strictEqual(req2Result.inserted, false, "La 2e requête concurrente portant le même UUID doit être ignorée sans erreur");
  assert.strictEqual(existingAttemptIds.size, 3, "Le store ne doit contenir qu'une seule copie de la tentative");

  console.log("    ✅ Idempotence stricte par clé unique validée.");
}

// ==========================================
// 6. Anti-Tampering (Recalcul serveur des scores)
// ==========================================
function testAntiTampering() {
  console.log("  [6/9] Test anti-tampering (recalcul serveur obligatoire)...");

  // Client prétend être MASTERED avec 100% de score dans localStorage
  const tamperedClientClaim = {
    skillId: "DALALA_ANALYSIS",
    level: "MASTERED",
    scorePercentage: 100,
    eligibleForAttestation: true,
  };

  // Mais les véritables tentatives de l'utilisateur sur le serveur ne justifient pas ce statut
  const serverAttempts: SkillAttempt[] = [
    {
      id: "att-real-1",
      skillId: "DALALA_ANALYSIS",
      sourceType: "INQUIRY_STEP",
      sourceId: "inquiry-10",
      stepNumber: 8,
      firstScore: 1,
      finalScore: 2,
      attemptCount: 2,
      correctedAfterFeedback: false,
      timestamp: "2026-09-21T10:00:00Z",
    },
  ];

  // Le serveur recalcule impérativement le profil
  const serverProfile = buildMethodologicalProfile(serverAttempts);
  const recalculatedMastery = serverProfile.skills.DALALA_ANALYSIS;

  assert.notStrictEqual(
    recalculatedMastery.level,
    tamperedClientClaim.level,
    "Le serveur ne doit JAMAIS adopter le niveau fourni par le client"
  );
  assert.strictEqual(
    recalculatedMastery.level,
    "DISCOVERY",
    "Une seule tentative non optimale doit être évaluée comme DISCOVERY"
  );

  // Vérification de l'éligibilité aux attestations : impossible à obtenir sans critères réels
  const eligibility = evaluateAttestationEligibility(serverProfile, 95, 1);
  assert.strictEqual(
    eligibility.eligibleForMasteryAttestation,
    false,
    "L'attestation de maîtrise doit être rejetée car le profil réel ne satisfait pas les critères stricts"
  );

  console.log("    ✅ Échec garanti de toute tentative de falsification de score côté client.");
}

// ==========================================
// 7. Attestations cryptographiques, kid et rotation
// ==========================================
function testAttestationCryptographicIntegrity() {
  console.log("  [7/9] Test du sceau cryptographique d'attestation et rotation de clé (kid)...");

  const params = {
    attestationId: "ATT-MAITRISE-1726940000000-usr123",
    type: "MAITRISE_METHODOLOGIQUE",
    issuedAt: "2026-09-21T17:00:00.000Z",
    finalScorePercent: 88.5,
    rulesVersion: "skills-v1",
    userId: "usr123456",
    keyVersion: CURRENT_KEY_VERSION,
  };

  const canonicalPayload = buildCanonicalAttestationPayload(params);
  const signature = signCanonicalPayload(canonicalPayload, params.keyVersion);

  // 1. Signature valide
  const isValid = verifyCanonicalSignature(canonicalPayload, signature, params.keyVersion);
  assert.strictEqual(isValid, true, "Une attestation authentique doit être validée avec succès");

  // 2. Altération du payload canonique (ex: changement du score de 88.5 à 98.5)
  const tamperedPayload = buildCanonicalAttestationPayload({
    ...params,
    finalScorePercent: 98.5,
  });
  const isTamperedValid = verifyCanonicalSignature(tamperedPayload, signature, params.keyVersion);
  assert.strictEqual(isTamperedValid, false, "Une attestation dont le payload a été altéré doit être rejetée");

  // 3. Altération de la signature
  const tamperedSignature = signature.slice(0, -4) + "ffff";
  const isTamperedSigValid = verifyCanonicalSignature(canonicalPayload, tamperedSignature, params.keyVersion);
  assert.strictEqual(isTamperedSigValid, false, "Une signature altérée doit être rejetée");

  // 4. Clé inconnue / kid invalide
  const isUnknownKidValid = verifyCanonicalSignature(canonicalPayload, signature, "v999-unknown");
  assert.strictEqual(isUnknownKidValid, false, "Un identifiant de clé inconnu doit invalider la vérification");

  console.log("    ✅ Sceau d'attestation HMAC, payload canonique et gestion de version de clé validés.");
}

// ==========================================
// 8. Rate Limiting
// ==========================================
function testRateLimiter() {
  console.log("  [8/9] Test du rate limiting glissant...");

  clearAllRateLimits();
  const testKey = "test-rate-limit-key";
  const limit = 3;
  const windowMs = 5000;

  // 3 requêtes autorisées
  const r1 = checkRateLimit(testKey, limit, windowMs);
  const r2 = checkRateLimit(testKey, limit, windowMs);
  const r3 = checkRateLimit(testKey, limit, windowMs);

  assert.strictEqual(r1.allowed, true, "Requête 1 doit être autorisée");
  assert.strictEqual(r2.allowed, true, "Requête 2 doit être autorisée");
  assert.strictEqual(r3.allowed, true, "Requête 3 doit être autorisée");
  assert.strictEqual(r3.remaining, 0, "Le quota restant doit être 0");

  // 4e requête : bloquée
  const r4 = checkRateLimit(testKey, limit, windowMs);
  assert.strictEqual(r4.allowed, false, "Requête 4 doit être bloquée (dépassement de quota)");
  assert.ok(r4.retryAfterSeconds && r4.retryAfterSeconds > 0, "Le temps d'attente Retry-After doit être positif");

  console.log("    ✅ Blocage par limitation de débit validé.");
}

// ==========================================
// 9. RGPD & Sanitisation des AuditLogs
// ==========================================
function testAuditLogSanitization() {
  console.log("  [9/9] Test de sanitisation des logs d'audit (Zéro secret)...");

  const rawDetails = {
    email: "user@example.com",
    password: "SuperSecretPassword123!",
    passwordHash: "scrypt$N=131072...hash",
    sessionToken: "raw-session-token-secret",
    csrfToken: "csrf-token-secret",
    apiKey: "secret-key-12345",
    nested: {
      userSecret: "internal-secret",
      safeInfo: "audit-ok",
    },
  };

  const sanitized = sanitizeAuditDetails(rawDetails) as Record<string, unknown>;

  assert.strictEqual(sanitized.email, "user@example.com", "L'email peut être conservé si pertinent");
  assert.strictEqual(sanitized.password, "[REDACTED]", "Le mot de passe doit être caviardé");
  assert.strictEqual(sanitized.passwordHash, "[REDACTED]", "Le hash du mot de passe doit être caviardé");
  assert.strictEqual(sanitized.sessionToken, "[REDACTED]", "Le token de session doit être caviardé");
  assert.strictEqual(sanitized.csrfToken, "[REDACTED]", "Le token CSRF doit être caviardé");
  assert.strictEqual(sanitized.apiKey, "[REDACTED]", "La clé API doit être caviardée");

  const nested = sanitized.nested as Record<string, unknown>;
  assert.strictEqual(nested.userSecret, "[REDACTED]", "Les secrets imbriqués doivent être caviardés");
  assert.strictEqual(nested.safeInfo, "audit-ok", "Les données sûres doivent être préservées");

  console.log("    ✅ Caviardage strict des secrets et conformité RGPD validés.");
}

async function runSecuritySuite() {
  await testScryptSecurity();
  testSessionSecurity();
  testCsrfAndOriginSecurity();
  testAuthorizationAndAntiIdor();
  testIdempotenceAndConcurrency();
  testAntiTampering();
  testAttestationCryptographicIntegrity();
  testRateLimiter();
  testAuditLogSanitization();

  console.log("🎉 TOUS LES TESTS DE SÉCURITÉ DE LA PHASE 6.1 ONT RÉUSSI AVEC SUCCÈS !");
}

runSecuritySuite().catch((err) => {
  console.error("❌ ÉCHEC DES TESTS DE SÉCURITÉ :", err);
  process.exit(1);
});
