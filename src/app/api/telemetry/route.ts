import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { TelemetryEventSchema } from "@/lib/telemetry";
import { verifyPilotSession } from "@/lib/pilot-session";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const rawBody = await req.json();

    // 1. Validation Zod stricte du payload via Discriminated Union
    const parseResult = TelemetryEventSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Payload de télémétrie invalide.", details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const {
      pilotSessionId,
      pilotSessionSignature,
      expiresAt,
      eventType,
      resourceType,
      resourceId,
      stepNumber,
      durationMs,
      metadata,
    } = parseResult.data;

    // 2. Vérification cryptographique de la session pilote signée HMAC
    const isSessionValid = verifyPilotSession(pilotSessionId, pilotSessionSignature, expiresAt);
    if (!isSessionValid) {
      return NextResponse.json(
        { error: "Session pilote invalide ou expirée." },
        { status: 401 }
      );
    }

    // 3. Double rate limiting anti-abus :
    // a. Par session signée (60 événements / min)
    const sessionRate = await checkRateLimit(`telemetry:session:${pilotSessionId}`, 60, 60 * 1000);
    if (!sessionRate.allowed) {
      return NextResponse.json(
        { error: "Limite d'événements atteinte pour cette session." },
        { status: 429, headers: { "Retry-After": String(sessionRate.retryAfterSeconds) } }
      );
    }

    // b. Par IP transitoire au niveau réseau (120 événements / min pour contrer les bots massifs)
    // RÈGLE D'OR RGPD : l'IP est utilisée uniquement en clé éphémère de rate-limit, JAMAIS persistée
    const ipRate = await checkRateLimit(`telemetry:ip:${ip}`, 120, 60 * 1000);
    if (!ipRate.allowed) {
      return NextResponse.json(
        { error: "Trop de requêtes réseau. Ralentissez." },
        { status: 429, headers: { "Retry-After": String(ipRate.retryAfterSeconds) } }
      );
    }

    // 4. Insertion append-only dans PostgreSQL (zéro IP, zéro User-Agent, zéro texte libre)
    await prisma.pedagogicalMetric.create({
      data: {
        sessionId: pilotSessionId,
        eventType,
        resourceType,
        resourceId,
        stepNumber,
        durationMs,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: unknown) {
    console.error("Erreur ingestion télémétrie pédagogique:", err);
    return NextResponse.json(
      { error: "Échec de l'enregistrement de la métrique." },
      { status: 500 }
    );
  }
}
