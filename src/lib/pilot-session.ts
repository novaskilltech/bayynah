import crypto from "crypto";

export interface PilotSessionToken {
  pilotSessionId: string;
  expiresAt: number;
  pilotSessionSignature: string;
}

function getPilotSecret(): string {
  return (
    process.env.CSRF_SECRET ||
    process.env.AUTH_SECRET ||
    "tabayyun-pilot-ephemeral-secret-key-2026-strict"
  );
}

/**
 * Génère un identifiant de session pilote signé HMAC côté serveur.
 * Valide pour une durée déterminée (par défaut 24 heures).
 */
export function generatePilotSession(ttlMs = 24 * 60 * 60 * 1000): PilotSessionToken {
  const pilotSessionId = "pilot_" + crypto.randomBytes(16).toString("hex");
  const expiresAt = Date.now() + ttlMs;
  const payload = `${pilotSessionId}:${expiresAt}`;
  const pilotSessionSignature = crypto
    .createHmac("sha256", getPilotSecret())
    .update(payload)
    .digest("hex");

  return {
    pilotSessionId,
    expiresAt,
    pilotSessionSignature,
  };
}

/**
 * Vérifie l'authenticité et la non-expiration d'une session pilote.
 */
export function verifyPilotSession(
  pilotSessionId: string,
  pilotSessionSignature: string,
  expiresAt: number
): boolean {
  if (!pilotSessionId || !pilotSessionSignature || !expiresAt) return false;
  if (Date.now() > expiresAt) return false;

  const expectedPayload = `${pilotSessionId}:${expiresAt}`;
  const expectedSignature = crypto
    .createHmac("sha256", getPilotSecret())
    .update(expectedPayload)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(pilotSessionSignature, "hex"),
      Buffer.from(expectedSignature, "hex")
    );
  } catch {
    return false;
  }
}
