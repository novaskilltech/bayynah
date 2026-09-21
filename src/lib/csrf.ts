import crypto from "crypto";
import { NextRequest } from "next/server";

export const CSRF_COOKIE_NAME =
  process.env.NODE_ENV === "production" ? "__Host-tabayyun_csrf" : "tabayyun_csrf";

export const CSRF_HEADER_NAME = "x-csrf-token";

/**
 * Génère un jeton CSRF cryptographiquement aléatoire
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Valide un jeton CSRF en temps constant (Double Submit Cookie)
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
 * Vérifie que l'en-tête Origin ou Referer correspond à l'hôte autorisé de l'application
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
 * Helper global de validation CSRF + Origin pour routes mutantes
 */
export function validateMutationRequest(req: NextRequest): { valid: boolean; error?: string } {
  // 1. Vérification Origin / Referer
  if (!verifyOriginOrReferer(req)) {
    return { valid: false, error: "Origine de la requête non autorisée (Origin/Referer invalide)." };
  }

  // 2. Vérification Double Submit Cookie CSRF
  const csrfCookie = req.cookies.get(CSRF_COOKIE_NAME)?.value;
  const csrfHeader = req.headers.get(CSRF_HEADER_NAME);

  if (!verifyCsrfToken(csrfCookie, csrfHeader)) {
    return { valid: false, error: "Jeton de sécurité CSRF manquant ou invalide." };
  }

  return { valid: true };
}
