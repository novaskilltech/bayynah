import { NextRequest, NextResponse } from "next/server";
import { purgeOldPedagogicalMetrics } from "@/lib/telemetry";

export async function handlePurgeRequest(
  req: NextRequest,
  purge: (days: number) => Promise<number> = purgeOldPedagogicalMetrics
) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: "Non autorisé : jeton cron manquant ou invalide." },
      { status: 401 }
    );
  }

  try {
    const deleted = await purge(90);
    return NextResponse.json({ success: true, deleted }, { status: 200 });
  } catch (error: unknown) {
    console.error("Erreur exécution cron purge métriques pédagogiques:", error);
    return NextResponse.json(
      { error: "Échec de l'exécution de la purge." },
      { status: 500 }
    );
  }
}
