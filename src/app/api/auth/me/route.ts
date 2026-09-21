import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { generatePreAuthCsrfToken, generateCsrfToken, CSRF_COOKIE_NAME } from "@/lib/csrf";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    let csrfToken = req.cookies.get(CSRF_COOKIE_NAME)?.value;

    // Si non authentifié, générer un jeton pré-auth signé valide
    if (!csrfToken) {
      csrfToken = user ? generateCsrfToken() : generatePreAuthCsrfToken();
    }

    const response = NextResponse.json({
      user: user || null,
      csrfToken,
    });

    response.cookies.set(CSRF_COOKIE_NAME, csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: user ? 60 * 60 * 24 * 30 : 60 * 60, // 1 heure pour le pré-auth
    });

    return response;
  } catch (err) {
    console.error("Erreur API me:", err);
    return NextResponse.json({ user: null, csrfToken: generatePreAuthCsrfToken() });
  }
}
