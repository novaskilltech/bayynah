import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, SESSION_CONFIG } from "@/lib/auth";
import { deleteUserAccount } from "@/lib/progress-sync/server-sync";
import { validateMutationRequest, CSRF_COOKIE_NAME } from "@/lib/csrf";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // 1. Protection CSRF & Origin
    const csrfCheck = validateMutationRequest(req);
    if (!csrfCheck.valid) {
      return NextResponse.json({ error: csrfCheck.error }, { status: 403 });
    }

    // 2. Dérivation de l'utilisateur exclusivement depuis la session serveur
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentification requise pour supprimer le compte." },
        { status: 401 }
      );
    }

    // 3. Rate limiting : 3 tentatives par heure
    const rateLimit = checkRateLimit(`delete:${user.id}`, 3, 60 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Trop de requêtes. Réessayez dans ${rateLimit.retryAfterSeconds} secondes.` },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      );
    }

    const result = await deleteUserAccount(user.id);

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
