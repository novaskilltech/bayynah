import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { syncUserProgress } from "@/lib/progress-sync/server-sync";
import { SyncPayload } from "@/lib/progress-sync/types";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentification requise pour la synchronisation serveur." },
        { status: 401 }
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
