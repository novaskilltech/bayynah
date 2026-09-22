import { NextRequest, NextResponse } from "next/server";
import { generatePilotSession } from "@/lib/pilot-session";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";

    // Rate limiting : 30 créations de session pilote par heure par IP
    const rateLimit = await checkRateLimit(`pilot_session:${ip}`, 30, 60 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Trop de sessions demandées. Réessayez plus tard." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      );
    }

    const session = generatePilotSession();

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (err: unknown) {
    console.error("Erreur génération session pilote:", err);
    return NextResponse.json(
      { error: "Impossible de créer la session pilote." },
      { status: 500 }
    );
  }
}
