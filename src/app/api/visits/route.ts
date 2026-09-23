import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MemoryRateLimitStore } from "@/lib/rate-limit";
import { incrementVisitCounter } from "@/lib/visit-counter";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };
// Route publique et non sensible : protection best-effort sans imposer un service Redis payant.
// Les routes d'authentification et de télémétrie conservent leur rate-limit distribué fail-closed.
const visitRateLimit = new MemoryRateLimitStore();

export async function POST(request: NextRequest) {
  try {
    // L'IP sert uniquement au rate limiting éphémère ; elle n'est jamais persistée.
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const rate = await visitRateLimit.check(`visits:ip:${ip}`, 60, 60 * 60 * 1000);

    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Trop de visites enregistrées depuis ce réseau." },
        {
          status: 429,
          headers: {
            ...NO_STORE_HEADERS,
            "Retry-After": String(rate.retryAfterSeconds ?? 3600),
          },
        }
      );
    }

    const count = await incrementVisitCounter(prisma.siteCounter);
    return NextResponse.json({ count }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error("Erreur compteur de visites:", error);
    return NextResponse.json(
      { error: "Compteur temporairement indisponible." },
      { status: 503, headers: NO_STORE_HEADERS }
    );
  }
}
