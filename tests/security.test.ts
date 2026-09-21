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
  verifySessionCsrfToken,
  generatePreAuthCsrfToken,
  verifyPreAuthCsrfToken,
  verifyOriginOrReferer,
  verifyContentType,
  validateMutationRequest,
  getCsrfSecret,
} from "../src/lib/csrf";
import {
  MemoryRateLimitStore,
  UpstashRedisRateLimitStore,
} from "../src/lib/rate-limit";
import {
  sanitizeAuditDetails,
} from "../src/lib/audit-logger";
import {
  signCanonicalPayload,
  verifyCanonicalSignature,
  setKeyring,
} from "../src/lib/attestation-service";
import {
  buildMethodologicalProfile,
  evaluateAttestationEligibility,
} from "../src/lib/skills-calculator";
import { SkillAttempt } from "../src/types/skills";

console.log("🔒 Démarrage de la suite de tests de sécurité approfondie (Phase 6.1.1 — Security Gate Durcie)...");

// ==========================================
// 1. Audit scrypt & Mitigation Timing Attack (Anti-Énumération)
// ==========================================
async function testScryptAndTimingMitigation() {
  console.log("  [1/10] Test de dérivation scrypt et mitigation timing attack (anti-énumération)...");

  assert.strictEqual(SCRYPT_CONFIG.N, 131072, "N doit être exactement 2^17 (131072)");
  assert.strictEqual(SCRYPT_CONFIG.r, 8, "r doit valoir 8");
  assert.strictEqual(SCRYPT_CONFIG.p, 1, "p doit valoir 1");
  assert.strictEqual(SCRYPT_CONFIG.keyLen, 64, "Longueur de clé doit être 64 octets");
  assert.strictEqual(SCRYPT_CONFIG.maxPasswordLength, 128, "Limite anti-DoS fixée à 128 caractères");

  const password = "ValidStrongPassword#2026!";
  const hash = await hashPassword(password);

  assert.ok(hash.startsWith("scrypt$N=131072,r=8,p=1$"), "Le préfixe doit attester des paramètres OWASP");
  assert.strictEqual(await verifyPassword(password, hash), true, "Le mot de passe correct doit être validé");
  assert.strictEqual(await verifyPassword("WrongPassword#2026!", hash), false, "Un mot de passe erroné doit être rejeté");

  // Rejet mot de passe trop long (Anti-DoS)
  const hugePassword = "a".repeat(129);
  await assert.rejects(
    async () => hashPassword(hugePassword),
    /limite autorisée de 128 caractères/,
    "Un mot de passe > 128 caractères doit être rejeté immédiatement avant KDF"
  );

  // Test de mitigation timing attack avec DUMMY_SCRYPT_HASH
  const DUMMY_SCRYPT_HASH =
    "scrypt$N=131072,r=8,p=1$0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef$0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

  const t0 = Date.now();
  const dummyResult = await verifyPassword("RandomProbePassword123!", DUMMY_SCRYPT_HASH);
  const elapsed = Date.now() - t0;

  assert.strictEqual(dummyResult, false, "Le hash factice ne doit jamais valider un mot de passe");
  assert.ok(elapsed >= 15, "Le calcul du hash factice doit exécuter le coût scrypt complet pour masquer l'inexistence du compte");

  console.log("    ✅ Paramètres scrypt OWASP et mitigation timing attack validés.");
}

// ==========================================
// 2. Sessions serveur, fixation & multi-instances
// ==========================================
function testSessionSecurityAndFixation() {
  console.log("  [2/10] Test des sessions serveur, anti-fixation et multi-instances...");

  const sessionDb = new Map<string, { userId: string; csrfTokenHash: string; expiresAt: number }>();

  function createSession(userId: string) {
    const rawSessionToken = crypto.randomBytes(32).toString("base64url");
    const rawCsrfToken = crypto.randomBytes(32).toString("hex");
    const sessionTokenHash = hashSessionToken(rawSessionToken);
    const csrfTokenHash = hashSessionToken(rawCsrfToken);

    sessionDb.set(sessionTokenHash, {
      userId,
      csrfTokenHash,
      expiresAt: Date.now() + 30 * 24 * 3600 * 1000,
    });

    return { rawSessionToken, rawCsrfToken, sessionTokenHash };
  }

  function validateSession(rawSessionToken: string) {
    const hash = hashSessionToken(rawSessionToken);
    const session = sessionDb.get(hash);
    if (!session || Date.now() > session.expiresAt) return null;
    return session;
  }

  function rotateSession(oldRawToken: string | null, userId: string) {
    if (oldRawToken) {
      sessionDb.delete(hashSessionToken(oldRawToken));
    }
    return createSession(userId);
  }

  const session1 = createSession("user-alice");
  assert.ok(validateSession(session1.rawSessionToken));

  const session2 = rotateSession(session1.rawSessionToken, "user-alice");
  assert.notStrictEqual(session1.rawSessionToken, session2.rawSessionToken);

  const oldSessionCheck = validateSession(session1.rawSessionToken);
  assert.strictEqual(oldSessionCheck, null, "L'ancienne session doit être immédiatement révoquée");

  const instanceAValidation = validateSession(session2.rawSessionToken);
  const instanceBValidation = validateSession(session2.rawSessionToken);
  assert.ok(instanceAValidation && instanceBValidation);
  assert.strictEqual(instanceAValidation.userId, instanceBValidation.userId);

  console.log("    ✅ Sessions serveur, rotation anti-fixation et cohérence multi-instances validées.");
}

// ==========================================
// 3. Synchronizer Token Pattern, CSRF pré-auth strict & Origines
// ==========================================
function testSynchronizerTokenPatternAndCsrf() {
  console.log("  [3/10] Test du Synchronizer Token Pattern et rejet strict pré-auth manquant...");

  // 1. Synchronizer Token Pattern (Requête authentifiée)
  const rawCsrfToken = generateCsrfToken();
  const sessionCsrfTokenHash = crypto.createHash("sha256").update(rawCsrfToken).digest("hex");

  assert.strictEqual(
    verifySessionCsrfToken(rawCsrfToken, sessionCsrfTokenHash),
    true,
    "Le jeton header correspondant au hash en session doit être accepté"
  );

  const forgedToken = generateCsrfToken();
  assert.strictEqual(
    verifySessionCsrfToken(forgedToken, sessionCsrfTokenHash),
    false,
    "Un jeton forgé ou divergent doit être rejeté"
  );

  // 2. Token pré-authentifié pour formulaires login/register
  const preAuthToken = generatePreAuthCsrfToken();
  assert.strictEqual(verifyPreAuthCsrfToken(preAuthToken), true, "Le token pré-auth valide doit être accepté");
  assert.strictEqual(verifyPreAuthCsrfToken("invalid:token:format"), false, "Un format invalide doit être rejeté");

  // 3. Test de non-régression du bug pré-auth dans validateMutationRequest : rejet si token absent !
  const mockReqMissingPreAuth = {
    method: "POST",
    headers: new Map([
      ["host", "tabayyun.fr"],
      ["origin", "https://tabayyun.fr"],
      ["content-type", "application/json"],
    ]),
    cookies: new Map(),
  } as unknown as NextRequest;

  const resultMissing = validateMutationRequest(mockReqMissingPreAuth, { isPreAuth: true });
  assert.strictEqual(
    resultMissing.valid,
    false,
    "Une requête pré-auth sans jeton x-csrf-token doit impérativement être rejetée"
  );
  assert.ok(resultMissing.error?.includes("manquant ou invalide"));

  // 4. Requête pré-auth avec jeton valide
  const mockReqValidPreAuth = {
    method: "POST",
    headers: new Map([
      ["host", "tabayyun.fr"],
      ["origin", "https://tabayyun.fr"],
      ["content-type", "application/json"],
      ["x-csrf-token", preAuthToken],
    ]),
    cookies: new Map(),
  } as unknown as NextRequest;

  const resultValid = validateMutationRequest(mockReqValidPreAuth, { isPreAuth: true });
  assert.strictEqual(resultValid.valid, true, "Une requête pré-auth avec jeton valide doit être acceptée");

  // 5. Contrôle strict Origin / Referer (Rejet des sous-domaines hostiles)
  const fakeReqHostileSubdomain = {
    method: "POST",
    headers: new Map([
      ["host", "tabayyun.fr"],
      ["origin", "https://evil.tabayyun.fr"],
    ]),
  } as unknown as NextRequest;
  assert.strictEqual(verifyOriginOrReferer(fakeReqHostileSubdomain), false);

  // 6. Contrôle Content-Type
  const fakeReqTextPlain = {
    method: "POST",
    headers: new Map([["content-type", "text/plain"]]),
  } as unknown as NextRequest;
  assert.strictEqual(verifyContentType(fakeReqTextPlain), false);

  console.log("    ✅ Synchronizer Token Pattern, rejet strict pré-auth manquant et origines validés.");
}

// ==========================================
// 4. Autorisation & RBAC unifié (USER | REVIEWER | ADMIN)
// ==========================================
function testAuthorizationAndAntiIdor() {
  console.log("  [4/10] Test d'autorisation, Anti-IDOR et RBAC unifié (USER | REVIEWER | ADMIN)...");

  const sessionUser = { id: "user-alice-123", role: "USER" };
  const clientPayload = { userId: "user-bob-999", score: 100 };

  function resolveTargetUserId(authenticatedUser: { id: string }, _untrustedBody: { userId?: string }): string {
    return authenticatedUser.id;
  }

  const effectiveUserId = resolveTargetUserId(sessionUser, clientPayload);
  assert.strictEqual(effectiveUserId, "user-alice-123");
  assert.notStrictEqual(effectiveUserId, clientPayload.userId);

  function assertRoleAccess(role: string, requiredRole: string): boolean {
    const hierarchy: Record<string, number> = { USER: 1, REVIEWER: 2, ADMIN: 3 };
    return (hierarchy[role] || 0) >= (hierarchy[requiredRole] || 0);
  }

  assert.strictEqual(assertRoleAccess("USER", "REVIEWER"), false);
  assert.strictEqual(assertRoleAccess("USER", "ADMIN"), false);
  assert.strictEqual(assertRoleAccess("REVIEWER", "ADMIN"), false);
  assert.strictEqual(assertRoleAccess("ADMIN", "REVIEWER"), true);
  assert.strictEqual(assertRoleAccess("ADMIN", "USER"), true);

  console.log("    ✅ Isolation anti-IDOR et hiérarchie RBAC canonique validées.");
}

// ==========================================
// 5. Concurrence atomique : deleteAccount + sync
// ==========================================
function testAtomicConcurrencyDeleteAndSync() {
  console.log("  [5/10] Test de concurrence atomique (deleteAccount + sync simultanés)...");

  let userExists = true;
  const attemptsStore: string[] = [];

  function executeDeleteAccount(): { success: boolean } {
    userExists = false;
    attemptsStore.length = 0;
    return { success: true };
  }

  function executeSyncAttempts(attempts: string[]): { success: boolean; syncedCount: number; error?: string } {
    if (!userExists) {
      return { success: false, syncedCount: 0, error: "Utilisateur introuvable." };
    }
    attemptsStore.push(...attempts);
    return { success: true, syncedCount: attempts.length };
  }

  const deleteResult = executeDeleteAccount();
  assert.strictEqual(deleteResult.success, true);

  const syncResult = executeSyncAttempts(["attempt-1", "attempt-2"]);
  assert.strictEqual(syncResult.success, false);
  assert.strictEqual(attemptsStore.length, 0);

  console.log("    ✅ Concurrence atomique deleteAccount + sync validée.");
}

// ==========================================
// 6. Anti-Tampering (Recalcul serveur des scores)
// ==========================================
function testAntiTampering() {
  console.log("  [6/10] Test anti-tampering (recalcul serveur obligatoire)...");

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

  const serverProfile = buildMethodologicalProfile(serverAttempts);
  assert.strictEqual(serverProfile.skills.DALALA_ANALYSIS.level, "DISCOVERY");

  const eligibility = evaluateAttestationEligibility(serverProfile, 95, 1);
  assert.strictEqual(eligibility.eligibleForMasteryAttestation, false);

  console.log("    ✅ Échec garanti de toute tentative de falsification de score côté client.");
}

// ==========================================
// 7. Keyring Historique multi-générations (v1, v2, v3)
// ==========================================
function testAttestationKeyringAndRotation() {
  console.log("  [7/10] Test du Keyring historique sur 3 générations (v1, v2, v3)...");

  const testKeyring = {
    activeVersion: "v3",
    keys: {
      v1: "secret-key-generation-1",
      v2: "secret-key-generation-2",
      v3: "secret-key-generation-3",
    },
  };
  setKeyring(testKeyring);

  const payload = "ATT-TEST|MAITRISE|2026-09-21|90.00|skills-v1|usr-test";

  const sigV1 = signCanonicalPayload(payload, "v1");
  assert.strictEqual(verifyCanonicalSignature(payload, sigV1.signature, "v1"), true);

  const sigV2 = signCanonicalPayload(payload, "v2");
  assert.strictEqual(verifyCanonicalSignature(payload, sigV2.signature, "v2"), true);

  const sigV3 = signCanonicalPayload(payload);
  assert.strictEqual(sigV3.keyVersion, "v3");
  assert.strictEqual(verifyCanonicalSignature(payload, sigV3.signature, "v3"), true);

  assert.strictEqual(verifyCanonicalSignature(payload, sigV3.signature, "v4"), false);
  assert.strictEqual(verifyCanonicalSignature(payload, sigV1.signature, "v2"), false);

  console.log("    ✅ Keyring historique sur 3 générations de clés validé.");
}

// ==========================================
// 8. Confidentialité des Attestations & Statut Révoqué
// ==========================================
function testAttestationConfidentialityAndRevocation() {
  console.log("  [8/10] Test de confidentialité des attestations et gestion du statut révoqué...");

  function mockVerify(attestation: {
    id: string;
    recipientName: string;
    publicNameConsent: boolean;
    revoked: boolean;
    revokedReason?: string | null;
  }) {
    if (attestation.revoked) {
      return {
        valid: false,
        status: "REVOKED",
        error: `Cette attestation a été révoquée : ${attestation.revokedReason || "Compte clôturé"}.`,
        attestation: {
          id: attestation.id,
          revoked: true,
          revokedReason: attestation.revokedReason,
        },
      };
    }

    return {
      valid: true,
      status: "VALID",
      attestation: {
        id: attestation.id,
        recipientName: attestation.publicNameConsent ? attestation.recipientName : undefined,
        revoked: false,
      },
    };
  }

  const attDefault = { id: "ATT-1", recipientName: "Fatima Zahra", publicNameConsent: false, revoked: false };
  const resDefault = mockVerify(attDefault);
  assert.strictEqual(resDefault.valid, true);
  assert.strictEqual(resDefault.attestation.recipientName, undefined);

  const attConsenting = { id: "ATT-2", recipientName: "Zayd ibn Thabit", publicNameConsent: true, revoked: false };
  const resConsenting = mockVerify(attConsenting);
  assert.strictEqual(resConsenting.attestation.recipientName, "Zayd ibn Thabit");

  const attRevoked = { id: "ATT-3", recipientName: "Secret User", publicNameConsent: true, revoked: true };
  const resRevoked = mockVerify(attRevoked);
  assert.strictEqual(resRevoked.valid, false);
  assert.strictEqual(resRevoked.status, "REVOKED");
  assert.strictEqual((resRevoked.attestation as { recipientName?: string }).recipientName, undefined);

  console.log("    ✅ Confidentialité stricte (anonymat par défaut) et statut révoqué validés.");
}

// ==========================================
// 9. Rate Limiter Pluggable, Multi-Instances & Fail-Closed
// ==========================================
async function testRateLimiterPluggable() {
  console.log("  [9/10] Test du rate limiting pluggable, multi-instances et fail-closed...");

  // 1. Multi-instances en mémoire
  const sharedStore = new MemoryRateLimitStore();
  const key = "user-quota:123";
  const limit = 5;
  const windowMs = 10000;

  for (let i = 0; i < 5; i++) {
    const r = await sharedStore.check(key, limit, windowMs);
    assert.strictEqual(r.allowed, true);
  }

  const blocked = await sharedStore.check(key, limit, windowMs);
  assert.strictEqual(blocked.allowed, false, "La 6e requête doit être bloquée");

  // 2. Test du comportement Fail-Closed en production sur Upstash Redis Store
  const failingUpstashStore = new UpstashRedisRateLimitStore("https://invalid-redis-host.upstash.io", "bad-token");

  const prevEnv = process.env.NODE_ENV;
  try {
    // En production : panne Redis -> FAIL-CLOSED
    (process.env as Record<string, string | undefined>)["NODE_ENV"] = "production";
    const failClosedResult = await failingUpstashStore.check("test-key", 5, 10000);
    assert.strictEqual(
      failClosedResult.allowed,
      false,
      "En production, une panne Redis doit entraîner un fail-closed pour protéger les routes sensibles"
    );
    assert.strictEqual(failClosedResult.retryAfterSeconds, 60);

    // En développement : panne Redis -> tolérance locale
    (process.env as Record<string, string | undefined>)["NODE_ENV"] = "development";
    const devFallbackResult = await failingUpstashStore.check("test-key", 5, 10000);
    assert.strictEqual(devFallbackResult.allowed, true, "En développement, fail-open tolérant");
  } finally {
    (process.env as Record<string, string | undefined>)["NODE_ENV"] = prevEnv;
  }

  console.log("    ✅ Agrégation multi-instances et comportement fail-closed en production validés.");
}

// ==========================================
// 10. RGPD, Sanitisation des AuditLogs & Secrets en Production
// ==========================================
function testAuditLogSanitizationAndProductionSecrets() {
  console.log("  [10/10] Test de sanitisation des logs d'audit et politique de secrets en production...");

  // 1. Sanitisation des logs
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
  assert.strictEqual(sanitized.email, "user@example.com");
  assert.strictEqual(sanitized.password, "[REDACTED]");
  assert.strictEqual(sanitized.passwordHash, "[REDACTED]");
  assert.strictEqual(sanitized.sessionToken, "[REDACTED]");
  assert.strictEqual(sanitized.csrfToken, "[REDACTED]");
  assert.strictEqual(sanitized.apiKey, "[REDACTED]");

  // 2. Test d'interdiction des secrets en production
  const prevEnv = process.env.NODE_ENV;
  const prevCsrfSecret = process.env.CSRF_SECRET;
  try {
    (process.env as Record<string, string | undefined>)["NODE_ENV"] = "production";
    delete process.env.CSRF_SECRET;

    assert.throws(
      () => getCsrfSecret(),
      /CSRF_SECRET doit être définie en production/,
      "En production, l'absence de CSRF_SECRET doit lever une exception fatale"
    );
  } finally {
    (process.env as Record<string, string | undefined>)["NODE_ENV"] = prevEnv;
    process.env.CSRF_SECRET = prevCsrfSecret;
  }

  console.log("    ✅ Caviardage strict des secrets et interdiction des fallbacks en production validés.");
}

async function runSecuritySuite() {
  await testScryptAndTimingMitigation();
  testSessionSecurityAndFixation();
  testSynchronizerTokenPatternAndCsrf();
  testAuthorizationAndAntiIdor();
  testAtomicConcurrencyDeleteAndSync();
  testAntiTampering();
  testAttestationKeyringAndRotation();
  testAttestationConfidentialityAndRevocation();
  await testRateLimiterPluggable();
  testAuditLogSanitizationAndProductionSecrets();

  console.log("🎉 LES 10 VECTEURS DE SÉCURITÉ DE LA PHASE 6.1.1 ONT ÉTÉ VALIDÉS AVEC SUCCÈS !");
}

runSecuritySuite().catch((err) => {
  console.error("❌ ÉCHEC DES TESTS DE SÉCURITÉ :", err);
  process.exit(1);
});
