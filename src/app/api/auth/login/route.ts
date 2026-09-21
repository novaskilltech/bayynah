import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyPassword,
  rotateServerSession,
  SESSION_CONFIG,
  SCRYPT_CONFIG,
} from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  validateMutationRequest,
  CSRF_COOKIE_NAME,
} from "@/lib/csrf";
import { recordAuditEvent } from "@/lib/audit-logger";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";

    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "L'identifiant et le mot de passe sont requis." },
        { status: 400 }
      );
    }

    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    // 1. Rate limiting : 5 tentatives par 15 minutes par IP + email (store asynchrone)
    const rateLimit = await checkRateLimit(`login:${ip}:${normalizedEmail}`, 5, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Trop de tentatives de connexion échouées. Réessayez dans ${rateLimit.retryAfterSeconds} secondes.` },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      );
    }

    // 2. Protection CSRF & Origin (contrôle strict Origin/Referer + pré-auth)
    const csrfCheck = validateMutationRequest(req, { isPreAuth: true });
    if (!csrfCheck.valid) {
      return NextResponse.json({ error: csrfCheck.error }, { status: 403 });
    }

    if (typeof password !== "string" || password.length > SCRYPT_CONFIG.maxPasswordLength) {
      return NextResponse.json({ error: "Identifiants incorrects." }, { status: 401 });
    }

    // Hash scrypt factice pré-calculé (N=131072, r=8, p=1) pour neutraliser les attaques par analyse temporelle
    const DUMMY_SCRYPT_HASH =
      "scrypt$N=131072,r=8,p=1$0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef$0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Message d'erreur générique et neutralisation du canal auxiliaire temporel (timing attack)
    if (!user) {
      await verifyPassword(password, DUMMY_SCRYPT_HASH);
      return NextResponse.json({ error: "Identifiants incorrects." }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Identifiants incorrects." }, { status: 401 });
    }

    await recordAuditEvent("LOGIN", user.id, null, req);

    // Rotation de session : révocation de l'ancienne et génération synchronisée de sessionToken + csrfToken
    const oldSessionToken = req.cookies.get(SESSION_CONFIG.COOKIE_NAME)?.value || null;
    const { rawSessionToken, rawCsrfToken, expiresAt } = await rotateServerSession(
      oldSessionToken,
      user.id,
      req
    );

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      csrfToken: rawCsrfToken,
    });

    response.cookies.set(SESSION_CONFIG.COOKIE_NAME, rawSessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });

    response.cookies.set(CSRF_COOKIE_NAME, rawCsrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });

    return response;
  } catch (err) {
    console.error("Erreur API login:", err);
    return NextResponse.json(
      { error: "Erreur serveur lors de la connexion." },
      { status: 500 }
    );
  }
}
