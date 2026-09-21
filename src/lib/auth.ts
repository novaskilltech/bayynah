import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

const SESSION_COOKIE_NAME = "tabayyun_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 jours
const AUTH_SECRET = process.env.AUTH_SECRET || "tabayyun-secret-key-phase6-auth";

/**
 * Hache un mot de passe avec scrypt et un sel cryptographique aléatoire
 */
export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
}

/**
 * Vérifie un mot de passe en temps constant (anti-timing attacks)
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [salt, key] = storedHash.split(":");
    if (!salt || !key) {
      resolve(false);
      return;
    }
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      const keyBuffer = Buffer.from(key, "hex");
      if (keyBuffer.length !== derivedKey.length) {
        resolve(false);
        return;
      }
      resolve(crypto.timingSafeEqual(keyBuffer, derivedKey));
    });
  });
}

/**
 * Crée un jeton de session signé HMAC-SHA256
 */
export function createSessionToken(userId: string): string {
  const timestamp = Date.now().toString();
  const data = `${userId}:${timestamp}`;
  const signature = crypto.createHmac("sha256", AUTH_SECRET).update(data).digest("hex");
  return `${userId}.${timestamp}.${signature}`;
}

/**
 * Valide et décode un jeton de session
 */
export function verifySessionToken(token: string): { userId: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [userId, timestamp, signature] = parts;
    const data = `${userId}:${timestamp}`;
    const expectedSig = crypto.createHmac("sha256", AUTH_SECRET).update(data).digest("hex");

    const sigBuf = Buffer.from(signature, "hex");
    const expBuf = Buffer.from(expectedSig, "hex");

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    // Vérifier l'expiration (30 jours)
    const issueTime = parseInt(timestamp, 10);
    if (isNaN(issueTime) || Date.now() - issueTime > SESSION_MAX_AGE * 1000) {
      return null;
    }

    return { userId };
  } catch {
    return null;
  }
}

/**
 * Récupère l'utilisateur connecté courant côté serveur
 */
export async function getCurrentUser(): Promise<{
  id: string;
  email: string;
  name: string | null;
  role: Role;
} | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    if (!sessionCookie?.value) return null;

    const session = verifySessionToken(sessionCookie.value);
    if (!session) return null;

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, email: true, name: true, role: true },
    });

    return user;
  } catch {
    return null;
  }
}

export const SESSION_CONFIG = {
  COOKIE_NAME: SESSION_COOKIE_NAME,
  MAX_AGE: SESSION_MAX_AGE,
};
