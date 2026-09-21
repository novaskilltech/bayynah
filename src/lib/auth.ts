import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { NextRequest } from "next/server";

// Paramètres OWASP stricts pour scrypt : N = 2^17 (131072), r = 8, p = 1
export const SCRYPT_CONFIG = {
  N: 131072, // 2^17
  r: 8,
  p: 1,
  keyLen: 64,
  maxmem: 256 * 1024 * 1024, // 256 Mo
  maxPasswordLength: 128, // Anti-DoS avant KDF
};

export const SESSION_CONFIG = {
  COOKIE_NAME:
    process.env.NODE_ENV === "production" ? "__Host-tabayyun_session" : "tabayyun_session",
  MAX_AGE: 60 * 60 * 24 * 30, // 30 jours (en secondes)
};

/**
 * Hache un mot de passe avec scrypt selon les recommandations strictes OWASP (N=2^17, r=8, p=1)
 */
export async function hashPassword(password: string): Promise<string> {
  if (typeof password !== "string" || password.length === 0) {
    throw new Error("Le mot de passe ne peut pas être vide.");
  }
  if (password.length > SCRYPT_CONFIG.maxPasswordLength) {
    throw new Error(`Le mot de passe dépasse la limite autorisée de ${SCRYPT_CONFIG.maxPasswordLength} caractères.`);
  }

  return new Promise((resolve, reject) => {
    // Sel aléatoire individuel de 32 octets (256 bits)
    const salt = crypto.randomBytes(32).toString("hex");

    crypto.scrypt(
      password,
      salt,
      SCRYPT_CONFIG.keyLen,
      {
        cost: SCRYPT_CONFIG.N,
        blockSize: SCRYPT_CONFIG.r,
        parallelization: SCRYPT_CONFIG.p,
        maxmem: SCRYPT_CONFIG.maxmem,
      },
      (err, derivedKey) => {
        if (err) return reject(err);
        resolve(`scrypt$N=${SCRYPT_CONFIG.N},r=${SCRYPT_CONFIG.r},p=${SCRYPT_CONFIG.p}$${salt}$${derivedKey.toString("hex")}`);
      }
    );
  });
}

/**
 * Vérifie un mot de passe en temps constant avec protection anti-timing
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (typeof password !== "string" || password.length > SCRYPT_CONFIG.maxPasswordLength) {
    return false;
  }

  // Format durci OWASP : scrypt$N=131072,r=8,p=1$salt$hashHex
  if (storedHash.startsWith("scrypt$")) {
    const parts = storedHash.split("$");
    if (parts.length !== 4) return false;

    const salt = parts[2];
    const expectedKeyHex = parts[3];
    const expectedBuf = Buffer.from(expectedKeyHex, "hex");

    return new Promise((resolve) => {
      crypto.scrypt(
        password,
        salt,
        SCRYPT_CONFIG.keyLen,
        {
          cost: SCRYPT_CONFIG.N,
          blockSize: SCRYPT_CONFIG.r,
          parallelization: SCRYPT_CONFIG.p,
          maxmem: SCRYPT_CONFIG.maxmem,
        },
        (err, derivedKey) => {
          if (err) return resolve(false);
          if (derivedKey.length !== expectedBuf.length) return resolve(false);
          resolve(crypto.timingSafeEqual(derivedKey, expectedBuf));
        }
      );
    });
  }

  // Rétrocompatibilité avec le format initial salt:hashHex
  const [salt, key] = storedHash.split(":");
  if (!salt || !key) return false;

  return new Promise((resolve) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return resolve(false);
      const expectedBuf = Buffer.from(key, "hex");
      if (derivedKey.length !== expectedBuf.length) return resolve(false);
      resolve(crypto.timingSafeEqual(derivedKey, expectedBuf));
    });
  });
}

/**
 * Calcule le condensat SHA-256 d'un jeton opaque pour stockage sécurisé en base
 */
export function hashSessionToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

/**
 * Crée une session serveur opaque en base de données avec token CSRF synchronisé
 */
export async function createServerSession(
  userId: string,
  req?: NextRequest
): Promise<{ rawSessionToken: string; rawCsrfToken: string; expiresAt: Date }> {
  // Jeton de session opaque aléatoire de 32 octets (256 bits d'entropie)
  const rawSessionToken = crypto.randomBytes(32).toString("base64url");
  const hashedSessionToken = hashSessionToken(rawSessionToken);

  // Jeton CSRF de session aléatoire de 32 octets (Synchronizer Token Pattern)
  const rawCsrfToken = crypto.randomBytes(32).toString("hex");
  const hashedCsrfToken = hashSessionToken(rawCsrfToken);

  const expiresAt = new Date(Date.now() + SESSION_CONFIG.MAX_AGE * 1000);

  const ip = req ? req.headers.get("x-forwarded-for") || undefined : undefined;
  const userAgent = req ? req.headers.get("user-agent") || undefined : undefined;

  await prisma.session.create({
    data: {
      sessionToken: hashedSessionToken,
      csrfTokenHash: hashedCsrfToken,
      userId,
      expiresAt,
      ipAddress: ip,
      userAgent,
    },
  });

  return { rawSessionToken, rawCsrfToken, expiresAt };
}

/**
 * Valide une session serveur à partir du jeton opaque fourni
 */
export async function validateServerSession(rawToken: string): Promise<{
  session: { id: string; userId: string; expiresAt: Date; csrfTokenHash: string | null };
  user: { id: string; email: string; name: string | null; role: Role };
} | null> {
  if (!rawToken || typeof rawToken !== "string") return null;

  const hashedToken = hashSessionToken(rawToken);
  const session = await prisma.session.findUnique({
    where: { sessionToken: hashedToken },
    include: {
      user: {
        select: { id: true, email: true, name: true, role: true },
      },
    },
  });

  if (!session) return null;

  // Si la session est expirée, la purger et refuser
  if (new Date() > session.expiresAt) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  return {
    session: {
      id: session.id,
      userId: session.userId,
      expiresAt: session.expiresAt,
      csrfTokenHash: session.csrfTokenHash,
    },
    user: session.user,
  };
}

/**
 * Renouvelle la session (rotation de session après login ou changement de rôle)
 * Émet simultanément un nouveau jeton de session et un nouveau jeton CSRF lié
 */
export async function rotateServerSession(
  oldRawToken: string | null,
  userId: string,
  req?: NextRequest
): Promise<{ rawSessionToken: string; rawCsrfToken: string; expiresAt: Date }> {
  if (oldRawToken) {
    await revokeServerSession(oldRawToken);
  }
  return createServerSession(userId, req);
}

/**
 * Révoque une session serveur spécifique (logout)
 */
export async function revokeServerSession(rawToken: string): Promise<void> {
  if (!rawToken) return;
  const hashedToken = hashSessionToken(rawToken);
  await prisma.session.deleteMany({
    where: { sessionToken: hashedToken },
  }).catch(() => {});
}

/**
 * Révoque toutes les sessions d'un utilisateur (suppression de compte, changement de mot de passe)
 */
export async function revokeAllUserSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({
    where: { userId },
  }).catch(() => {});
}

/**
 * Récupère l'utilisateur connecté courant côté serveur à partir du cookie sécurisé
 */
export async function getCurrentUser(): Promise<{
  id: string;
  email: string;
  name: string | null;
  role: Role;
} | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_CONFIG.COOKIE_NAME);
    if (!sessionCookie?.value) return null;

    const validated = await validateServerSession(sessionCookie.value);
    if (!validated) return null;

    return validated.user;
  } catch {
    return null;
  }
}
