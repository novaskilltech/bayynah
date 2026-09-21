import { NextRequest, NextResponse } from "next/server";
import { verifyPublicAttestation } from "@/lib/attestation-service";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";

    // Rate limiting : 60 vérifications par minute par IP (store asynchrone)
    const rateLimit = await checkRateLimit(`attestation-verify:${ip}`, 60, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Trop de requêtes de vérification. Réessayez dans ${rateLimit.retryAfterSeconds} secondes.` },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const hash = searchParams.get("hash") || undefined;

    if (!id) {
      return NextResponse.json(
        { valid: false, status: "INVALID", error: "Identifiant d'attestation manquant." },
        { status: 400 }
      );
    }

    const result = await verifyPublicAttestation(id, hash);

    let httpStatus = 200;
    if (result.status === "NOT_FOUND") httpStatus = 404;
    else if (result.status === "INVALID") httpStatus = 400;

    return NextResponse.json(result, { status: httpStatus });
  } catch (err) {
    console.error("Erreur API attestation/verify:", err);
    return NextResponse.json(
      { valid: false, status: "INVALID", error: "Erreur lors de la vérification de l'attestation." },
      { status: 500 }
    );
  }
}
