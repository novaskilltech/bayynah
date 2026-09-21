import { NextRequest, NextResponse } from "next/server";
import { validateServerSession, SESSION_CONFIG } from "@/lib/auth";
import { deleteUserAccount } from "@/lib/progress-sync/server-sync";
import { validateMutationRequest, CSRF_COOKIE_NAME } from "@/lib/csrf";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // 1. Dérivation de l'utilisateur exclusivement depuis la session serveur (anti-IDOR)
    const sessionCookie = req.cookies.get(SESSION_CONFIG.COOKIE_NAME)?.value;
    if (!sessionCookie) {
      return NextResponse.json(
        { error: "Authentification requise pour supprimer le compte." },
        { status: 401 }
      );
    }

    const auth = await validateServerSession(sessionCookie);
    if (!auth) {
      return NextResponse.json(
        { error: "Session invalide ou expirée." },
        { status: 401 }
      );
    }

    // 2. Protection CSRF : Synchronizer Token Pattern lié à la session
    const csrfCheck = validateMutationRequest(req, {
      sessionCsrfTokenHash: auth.session.csrfTokenHash,
    });
    if (!csrfCheck.valid) {
      return NextResponse.json({ error: csrfCheck.error }, { status: 403 });
    }

    // 3. Rate limiting : 3 tentatives par heure (store asynchrone)
    const rateLimit = await checkRateLimit(`delete:${auth.user.id}`, 3, 60 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Trop de requêtes. Réessayez dans ${rateLimit.retryAfterSeconds} secondes.` },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      );
    }

    const result = await deleteUserAccount(auth.user.id);

    const response = NextResponse.json(result);
    response.cookies.delete(SESSION_CONFIG.COOKIE_NAME);
    response.cookies.delete(CSRF_COOKIE_NAME);
    return response;
  } catch (err) {
    console.error("Erreur API delete account:", err);
    return NextResponse.json(
      { error: "Erreur serveur lors de la suppression du compte." },
      { status: 500 }
    );
  }
}
