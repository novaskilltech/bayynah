import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { TelemetryEventSchema, sanitizeTelemetryMetadata } from "@/lib/telemetry";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();

    // 1. Validation Zod du payload
    const parseResult = TelemetryEventSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Payload de télémétrie invalide.", details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const { sessionId, eventType, resourceType, resourceId, stepNumber, durationMs, metadata } = parseResult.data;

    // 2. Rate limiting par sessionId (60 requêtes par minute)
    // L'IP n'est utilisée que comme clé de hachage éphémère du rate-limiter, JAMAIS stockée en base
    const rateLimit = await checkRateLimit(`telemetry:${sessionId}`, 60, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Limite d'événements de télémétrie atteinte." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      );
    }

    // 3. Sanitisation stricte des métadonnées
    const cleanMetadata = sanitizeTelemetryMetadata(metadata);

    // 4. Insertion append-only dans PostgreSQL (zéro IP, zéro User-Agent)
    await prisma.pedagogicalMetric.create({
      data: {
        sessionId,
        eventType,
        resourceType,
        resourceId,
        stepNumber,
        durationMs,
        metadata: cleanMetadata ? JSON.parse(JSON.stringify(cleanMetadata)) : undefined,
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: unknown) {
    console.error("Erreur ingestion télémétrie pédagogique:", err);
    // En cas d'erreur de base de données en test ou hors-ligne, ne pas crasher le client
    return NextResponse.json(
      { error: "Échec de l'enregistrement de la métrique." },
      { status: 500 }
    );
  }
}
