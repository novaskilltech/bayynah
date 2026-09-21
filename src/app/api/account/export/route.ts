import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { exportUserData } from "@/lib/progress-sync/server-sync";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(_req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentification requise pour exporter vos données." },
        { status: 401 }
      );
    }

    // Rate limiting : 5 exports par heure par utilisateur
    const rateLimit = checkRateLimit(`export:${user.id}`, 5, 60 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Limite d'export atteinte. Réessayez dans ${rateLimit.retryAfterSeconds} secondes.` },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      );
    }

    const exportData = await exportUserData(user.id);

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="tabayyun-export-${user.id}-${Date.now()}.json"`,
      },
    });
  } catch (err) {
    console.error("Erreur API export:", err);
    return NextResponse.json(
      { error: "Erreur lors de l'export des données." },
      { status: 500 }
    );
  }
}
