import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { validateMutationRequest } from "@/lib/csrf";
import { createScientificProposalPR, ProposalRequest } from "@/lib/github-service";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";

    // 1. Contrôle d'accès RBAC : seuls REVIEWER et ADMIN ont accès aux propositions scientifiques
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    }

    if (user.role !== "REVIEWER" && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Accès refusé : rôle REVIEWER ou ADMIN requis pour soumettre une proposition scientifique." },
        { status: 403 }
      );
    }

    // 2. Rate limiting spécifique aux propositions (10 propositions par heure par utilisateur et IP)
    const rateLimit = await checkRateLimit(`proposal:${user.id}:${ip}`, 10, 60 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Limite de propositions atteinte. Réessayez dans ${rateLimit.retryAfterSeconds} secondes.` },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      );
    }

    // 3. Validation CSRF & Origin (Synchronizer Token Pattern)
    const csrfCheck = validateMutationRequest(req);
    if (!csrfCheck.valid) {
      return NextResponse.json({ error: csrfCheck.error }, { status: 403 });
    }

    // 4. Lecture et validation du corps de la requête
    const body = await req.json();
    const {
      type,
      slug,
      proposedContent,
      checklistAnswers,
      reviewerNotes,
      baseCommitSha,
    } = body;

    if (!type || !slug || !proposedContent || !checklistAnswers) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants (type, slug, proposedContent, checklistAnswers)." },
        { status: 400 }
      );
    }

    if (type !== "lesson" && type !== "inquiry") {
      return NextResponse.json(
        { error: "Le paramètre type doit être 'lesson' ou 'inquiry'." },
        { status: 400 }
      );
    }

    // 5. Exécution du moteur de gouvernance et création de la PR (chargement canonique serveur)
    const proposalParams: ProposalRequest = {
      type,
      slug,
      proposedContent,
      checklistAnswers,
      reviewerNotes,
      userId: user.id,
      userEmail: user.email,
      baseCommitSha,
    };

    const result = await createScientificProposalPR(proposalParams);

    return NextResponse.json({
      success: true,
      proposal: result,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const errorCode = (err as { code?: string })?.code;

    console.error("Erreur création proposition scientifique:", err);

    if (errorCode === "STALE_EDIT_CONFLICT") {
      return NextResponse.json(
        { error: errorMsg, code: "STALE_EDIT_CONFLICT" },
        { status: 409 }
      );
    }

    if (errorMsg.includes("Échec critique de l'intégration GitHub")) {
      return NextResponse.json(
        { error: errorMsg },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { error: errorMsg || "Une erreur est survenue lors de la création de la proposition." },
      { status: 400 }
    );
  }
}
