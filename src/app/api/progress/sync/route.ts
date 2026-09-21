import { NextRequest, NextResponse } from "next/server";
import { validateServerSession, SESSION_CONFIG } from "@/lib/auth";
import { syncUserProgress } from "@/lib/progress-sync/server-sync";
import { SyncPayload } from "@/lib/progress-sync/types";
import { validateMutationRequest } from "@/lib/csrf";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // 1. Dérivation stricte de l'identité et de la session serveur (anti-IDOR)
    const sessionCookie = req.cookies.get(SESSION_CONFIG.COOKIE_NAME)?.value;
    if (!sessionCookie) {
      return NextResponse.json(
        { error: "Authentification requise pour la synchronisation serveur." },
        { status: 401 }
      );
    }

    const auth = await validateServerSession(sessionCookie);
    if (!auth) {
      return NextResponse.json(
        { error: "Session invalide ou expirée. Veuillez vous reconnecter." },
        { status: 401 }
      );
    }

    // 2. Protection CSRF : Synchronizer Token Pattern lié à la session serveur
    const csrfCheck = validateMutationRequest(req, {
      sessionCsrfTokenHash: auth.session.csrfTokenHash,
    });
    if (!csrfCheck.valid) {
      return NextResponse.json({ error: csrfCheck.error }, { status: 403 });
    }

    // 3. Rate limiting : 60 synchronisations par minute par utilisateur
    const rateLimit = await checkRateLimit(`sync:${auth.user.id}`, 60, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Trop de requêtes de synchronisation. Réessayez dans ${rateLimit.retryAfterSeconds} secondes.` },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      );
    }

    const payload: SyncPayload = await req.json();
    const clientIp = req.headers.get("x-forwarded-for") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const result = await syncUserProgress(auth.user.id, payload, clientIp, userAgent);

    return NextResponse.json(result);
  } catch (err) {
    console.error("Erreur API progress/sync:", err);
    return NextResponse.json(
      { error: "Erreur lors de la synchronisation de la progression." },
      { status: 500 }
    );
  }
}
