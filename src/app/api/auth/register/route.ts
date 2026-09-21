import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  createServerSession,
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

    // 1. Rate limiting : 3 inscriptions par heure par IP (store asynchrone)
    const rateLimit = await checkRateLimit(`register:${ip}`, 3, 60 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Trop de tentatives de création de compte. Réessayez dans ${rateLimit.retryAfterSeconds} secondes.` },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      );
    }

    // 2. Protection CSRF & Origin
    const csrfCheck = validateMutationRequest(req, { isPreAuth: true });
    if (!csrfCheck.valid) {
      return NextResponse.json({ error: csrfCheck.error }, { status: 403 });
    }

    const body = await req.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "L'adresse email et le mot de passe sont obligatoires." },
        { status: 400 }
      );
    }

    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit comporter au moins 8 caractères." },
        { status: 400 }
      );
    }

    if (password.length > SCRYPT_CONFIG.maxPasswordLength) {
      return NextResponse.json(
        { error: `Le mot de passe ne doit pas dépasser ${SCRYPT_CONFIG.maxPasswordLength} caractères.` },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      // Mitigation timing attack : exécution du KDF scrypt pour égaliser rigoureusement
      // le temps de réponse avec le cas de création réussie (qui appelle hashPassword)
      await hashPassword(password);

      // Anti-énumération de comptes : message neutre ne révélant pas l'existence de l'adresse email.
      // Arbitrage UX assumé : statut 400 maintenu pour permettre une connexion fluide et directe
      // de l'apprenant sans aller-retour d'email à ce stade, sécurisé par un rate limiting strict
      // (3 inscriptions/heure/IP) et le jeton CSRF pré-authentification obligatoire.
      return NextResponse.json(
        { error: "Impossible de créer le compte avec ces informations. Veuillez vous connecter ou réinitialiser votre mot de passe." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        name: name ? name.trim() : null,
        role: "USER",
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    await recordAuditEvent("REGISTER", user.id, { email: normalizedEmail }, req);

    // Création d'une session opaque en base avec Synchronizer Token CSRF
    const { rawSessionToken, rawCsrfToken, expiresAt } = await createServerSession(user.id, req);

    const response = NextResponse.json({ success: true, user, csrfToken: rawCsrfToken });

    // Cookie de session sécurisé
    response.cookies.set(SESSION_CONFIG.COOKIE_NAME, rawSessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });

    // Cookie CSRF
    response.cookies.set(CSRF_COOKIE_NAME, rawCsrfToken, {
      httpOnly: false, // Accessible JS pour l'envoi dans le header x-csrf-token
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });

    return response;
  } catch (err) {
    console.error("Erreur API register:", err);
    return NextResponse.json(
      { error: "Erreur serveur lors de la création du compte." },
      { status: 500 }
    );
  }
}
