import { NextRequest, NextResponse } from "next/server";
import { revokeServerSession, validateServerSession, SESSION_CONFIG } from "@/lib/auth";
import { validateMutationRequest, CSRF_COOKIE_NAME } from "@/lib/csrf";

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get(SESSION_CONFIG.COOKIE_NAME)?.value;
    let csrfTokenHash: string | null = null;

    if (sessionToken) {
      const auth = await validateServerSession(sessionToken);
      if (auth) {
        csrfTokenHash = auth.session.csrfTokenHash;
      }
    }

    const csrfCheck = validateMutationRequest(req, { sessionCsrfTokenHash: csrfTokenHash });
    if (!csrfCheck.valid) {
      return NextResponse.json({ error: csrfCheck.error }, { status: 403 });
    }

    if (sessionToken) {
      await revokeServerSession(sessionToken);
    }

    const response = NextResponse.json({ success: true });
    response.cookies.delete(SESSION_CONFIG.COOKIE_NAME);
    response.cookies.delete(CSRF_COOKIE_NAME);
    return response;
  } catch (err) {
    console.error("Erreur API logout:", err);
    return NextResponse.json({ error: "Erreur lors de la déconnexion." }, { status: 500 });
  }
}
