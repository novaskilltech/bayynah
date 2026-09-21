import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { generateCsrfToken, CSRF_COOKIE_NAME } from "@/lib/csrf";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    let csrfToken = req.cookies.get(CSRF_COOKIE_NAME)?.value;

    const response = NextResponse.json({
      user: user || null,
      csrfToken: csrfToken || generateCsrfToken(),
    });

    // Si pas de cookie CSRF existant, en initialiser un
    if (!csrfToken) {
      csrfToken = generateCsrfToken();
      response.cookies.set(CSRF_COOKIE_NAME, csrfToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    return response;
  } catch (err) {
    console.error("Erreur API me:", err);
    return NextResponse.json({ user: null, csrfToken: generateCsrfToken() });
  }
}
