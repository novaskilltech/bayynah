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
  generateCsrfToken,
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

    // 1. Rate limiting : 5 tentatives par 15 minutes par IP + email
    const rateLimit = checkRateLimit(`login:${ip}:${normalizedEmail}`, 5, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Trop de tentatives de connexion échouées. Réessayez dans ${rateLimit.retryAfterSeconds} secondes.` },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      );
    }

    // 2. Protection CSRF & Origin
    const csrfCheck = validateMutationRequest(req);
    if (!csrfCheck.valid) {
      return NextResponse.json({ error: csrfCheck.error }, { status: 403 });
    }

    if (typeof password !== "string" || password.length > SCRYPT_CONFIG.maxPasswordLength) {
      return NextResponse.json({ error: "Identifiants incorrects." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Message d'erreur générique : anti-énumération de comptes
    if (!user) {
      return NextResponse.json({ error: "Identifiants incorrects." }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Identifiants incorrects." }, { status: 401 });
    }

    await recordAuditEvent("LOGIN", user.id, null, req);

    // Rotation de session : révocation de l'ancienne et création d'une nouvelle en base
    const oldSessionToken = req.cookies.get(SESSION_CONFIG.COOKIE_NAME)?.value || null;
    const { rawToken, expiresAt } = await rotateServerSession(oldSessionToken, user.id, req);
    const csrfToken = generateCsrfToken();

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      csrfToken,
    });

    response.cookies.set(SESSION_CONFIG.COOKIE_NAME, rawToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });

    response.cookies.set(CSRF_COOKIE_NAME, csrfToken, {
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
