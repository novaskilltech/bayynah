import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { syncUserProgress } from "@/lib/progress-sync/server-sync";
import { SyncPayload } from "@/lib/progress-sync/types";
import { validateMutationRequest } from "@/lib/csrf";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // 1. Protection CSRF & Origin
    const csrfCheck = validateMutationRequest(req);
    if (!csrfCheck.valid) {
      return NextResponse.json({ error: csrfCheck.error }, { status: 403 });
    }

    // 2. Dérivation stricte de l'identité depuis la session serveur (anti-IDOR)
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentification requise pour la synchronisation serveur." },
        { status: 401 }
      );
    }

    // 3. Rate limiting : 60 synchronisations par minute par utilisateur
    const rateLimit = checkRateLimit(`sync:${user.id}`, 60, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Trop de requêtes de synchronisation. Réessayez dans ${rateLimit.retryAfterSeconds} secondes.` },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      );
    }

    const payload: SyncPayload = await req.json();
    const clientIp = req.headers.get("x-forwarded-for") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const result = await syncUserProgress(user.id, payload, clientIp, userAgent);

    return NextResponse.json(result);
  } catch (err) {
    console.error("Erreur API progress/sync:", err);
    return NextResponse.json(
      { error: "Erreur lors de la synchronisation de la progression." },
      { status: 500 }
    );
  }
}
