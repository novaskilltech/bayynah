import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { validateMutationRequest } from "@/lib/csrf";
import { createScientificProposalPR, ProposalRequest } from "@/lib/github-service";
import { checkRateLimit } from "@/lib/rate-limit";
import { validateAdminProposalAccess } from "@/lib/scientific-governance";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";

    // 1. Contrôle d'accès RBAC : seuls REVIEWER et ADMIN ont accès aux propositions scientifiques
    const user = await getCurrentUser();
    const accessCheck = validateAdminProposalAccess(user);
    if (!accessCheck.allowed || !user) {
      return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status });
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
      baseFileSha,
    } = body;

    if (!type || !slug || !proposedContent || !checklistAnswers || !baseFileSha) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants (type, slug, proposedContent, checklistAnswers, baseFileSha)." },
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
      baseFileSha,
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
