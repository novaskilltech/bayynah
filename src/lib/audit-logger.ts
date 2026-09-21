import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

const SENSITIVE_KEYS = new Set([
  "password",
  "passwordhash",
  "hash",
  "token",
  "sessiontoken",
  "csrf",
  "secret",
  "key",
  "salt",
  "authorization",
  "cookie",
]);

/**
 * Nettoie récursivement un objet de détails pour éliminer tout secret ou donnée sensible
 */
export function sanitizeAuditDetails(data: unknown): unknown {
  if (!data || typeof data !== "object") return data;

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeAuditDetails(item));
  }

  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();
    const isSensitive =
      SENSITIVE_KEYS.has(lowerKey) ||
      lowerKey.includes("password") ||
      lowerKey.includes("secret") ||
      lowerKey.includes("token") ||
      lowerKey.includes("csrf") ||
      lowerKey.includes("key") ||
      lowerKey.includes("hash") ||
      lowerKey.includes("auth");

    if (isSensitive) {
      cleaned[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      cleaned[key] = sanitizeAuditDetails(value);
    } else {
      cleaned[key] = value;
    }
  }

  return cleaned;
}

/**
 * Enregistre un événement d'audit sécurisé et sanitizé
 */
export async function recordAuditEvent(
  action: string,
  userId: string | null,
  details: Record<string, unknown> | null,
  req?: NextRequest
) {
  try {
    const sanitized = details ? sanitizeAuditDetails(details) : undefined;
    const ip = req ? req.headers.get("x-forwarded-for") || undefined : undefined;
    const userAgent = req ? req.headers.get("user-agent") || undefined : undefined;

    await prisma.auditLog.create({
      data: {
        action,
        userId: userId || undefined,
        details: sanitized ? JSON.parse(JSON.stringify(sanitized)) : undefined,
        ipAddress: ip,
        userAgent,
      },
    });
  } catch (err) {
    console.error("Erreur lors de l'enregistrement de l'AuditLog:", err);
  }
}
