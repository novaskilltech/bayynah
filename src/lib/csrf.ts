import crypto from "crypto";
import { NextRequest } from "next/server";

export const CSRF_COOKIE_NAME =
  process.env.NODE_ENV === "production" ? "__Host-tabayyun_csrf" : "tabayyun_csrf";

export const CSRF_HEADER_NAME = "x-csrf-token";

/**
 * Récupère le secret CSRF pour tokens pré-authentifiés
 * En production, l'absence de secret lève immédiatement une exception fatale (fail-fast)
 */
export function getCsrfSecret(): string {
  const secret = process.env.CSRF_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error(
      "Variable d'environnement critique manquante : CSRF_SECRET doit être définie en production."
    );
  }
  return secret || "dev-only-csrf-secret-key-32bytes-min!";
}

/**
 * Génère un jeton CSRF cryptographiquement aléatoire (32 octets hex)
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Valide un jeton CSRF en temps constant (Double Submit Cookie de base)
 */
export function verifyCsrfToken(
  cookieToken?: string | null,
  headerToken?: string | null
): boolean {
  if (!cookieToken || !headerToken) {
    return false;
  }

  const cookieBuf = Buffer.from(cookieToken, "hex");
  const headerBuf = Buffer.from(headerToken, "hex");

  if (cookieBuf.length !== 32 || headerBuf.length !== 32) {
    return false;
  }

  return crypto.timingSafeEqual(cookieBuf, headerBuf);
}

/**
 * Valide un jeton CSRF selon le Synchronizer Token Pattern (lié à la session serveur)
 * Calcule le SHA-256 du jeton header fourni et le compare en temps constant au hash stocké en DB
 */
export function verifySessionCsrfToken(
  headerToken: string | null | undefined,
  sessionCsrfTokenHash: string | null | undefined
): boolean {
  if (!headerToken || !sessionCsrfTokenHash) {
    return false;
  }

  const computedHash = crypto.createHash("sha256").update(headerToken).digest("hex");
  const compBuf = Buffer.from(computedHash, "hex");
  const storedBuf = Buffer.from(sessionCsrfTokenHash, "hex");

  if (compBuf.length !== storedBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(compBuf, storedBuf);
}

/**
 * Génère un jeton CSRF pré-authentifié signé HMAC (pour formulaires de login/register avant session)
 */
export function generatePreAuthCsrfToken(): string {
  const secret = getCsrfSecret();
  const timestamp = Date.now().toString();
  const nonce = crypto.randomBytes(16).toString("hex");
  const data = `${timestamp}:${nonce}`;
  const hmac = crypto.createHmac("sha256", secret).update(data).digest("hex");
  return `${data}:${hmac}`;
}

/**
 * Valide un jeton CSRF pré-authentifié signé HMAC (durée de validité 1 heure)
 */
export function verifyPreAuthCsrfToken(token: string | null | undefined): boolean {
  if (!token || typeof token !== "string") return false;

  const parts = token.split(":");
  if (parts.length !== 3) return false;

  const [timestampStr, nonce, expectedHmac] = parts;
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) return false;

  // Validité max 1 heure, rejet si dans le futur (> 1 min)
  const now = Date.now();
  if (now - timestamp > 60 * 60 * 1000 || now < timestamp - 60 * 1000) {
    return false;
  }

  const secret = getCsrfSecret();
  const data = `${timestampStr}:${nonce}`;
  const actualHmac = crypto.createHmac("sha256", secret).update(data).digest("hex");
  const bufA = Buffer.from(actualHmac, "hex");
  const bufB = Buffer.from(expectedHmac, "hex");

  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Vérifie que l'en-tête Origin ou Referer correspond strictement à l'hôte de l'application
 * Rejette explicitement tout domaine tiers ou sous-domaine hostile (ex: evil.tabayyun.fr)
 */
export function verifyOriginOrReferer(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const host = req.headers.get("host");

  if (!host) return false;

  // Si ni Origin ni Referer n'est fourni, refuser sur les requêtes mutantes
  if (!origin && !referer) {
    return false;
  }

  if (origin) {
    try {
      const originUrl = new URL(origin);
      if (originUrl.host !== host) {
        return false;
      }
    } catch {
      return false;
    }
  }

  if (referer && !origin) {
    try {
      const refererUrl = new URL(referer);
      if (refererUrl.host !== host) {
        return false;
      }
    } catch {
      return false;
    }
  }

  return true;
}

/**
 * Valide que le Content-Type d'une requête mutante est acceptable (anti-CORS bypass)
 */
export function verifyContentType(req: NextRequest): boolean {
  const method = req.method.toUpperCase();
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const contentType = req.headers.get("content-type");
    if (!contentType) return true; // Requêtes sans body autorisées
    const lower = contentType.toLowerCase();
    if (
      lower.includes("application/json") ||
      lower.includes("multipart/form-data") ||
      lower.includes("application/x-www-form-urlencoded")
    ) {
      return true;
    }
    return false;
  }
  return true;
}

/**
 * Helper global de validation CSRF + Origin pour routes mutantes
 */
export function validateMutationRequest(
  req: NextRequest,
  options?: {
    sessionCsrfTokenHash?: string | null;
    isPreAuth?: boolean;
  }
): { valid: boolean; error?: string } {
  // 1. Vérification Content-Type
  if (!verifyContentType(req)) {
    return { valid: false, error: "Content-Type non autorisé pour cette requête." };
  }

  // 2. Vérification Origin / Referer
  if (!verifyOriginOrReferer(req)) {
    return { valid: false, error: "Origine de la requête non autorisée (Origin/Referer invalide)." };
  }

  const csrfHeader = req.headers.get(CSRF_HEADER_NAME);

  // 3. Synchronizer Token Pattern (Requête authentifiée avec session serveur)
  if (options?.sessionCsrfTokenHash) {
    if (!verifySessionCsrfToken(csrfHeader, options.sessionCsrfTokenHash)) {
      return { valid: false, error: "Jeton CSRF de session invalide ou non concordant." };
    }
    return { valid: true };
  }

  // 4. Token pré-auth pour formulaires login/register (Rejet obligatoire si manquant ou invalide)
  if (options?.isPreAuth) {
    if (!csrfHeader || !verifyPreAuthCsrfToken(csrfHeader)) {
      return { valid: false, error: "Jeton CSRF pré-authentifié manquant ou invalide." };
    }
    return { valid: true };
  }

  // 5. Fallback Double Submit Cookie
  const csrfCookie = req.cookies.get(CSRF_COOKIE_NAME)?.value;
  if (!verifyCsrfToken(csrfCookie, csrfHeader)) {
    return { valid: false, error: "Jeton de sécurité CSRF manquant ou invalide." };
  }

  return { valid: true };
}
