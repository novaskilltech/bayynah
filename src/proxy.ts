import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const locales = ["fr", "ar"];
const defaultLocale = "fr";

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignorer les fichiers statiques, api et _next
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Vérifier si le chemin commence déjà par une locale supportée
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    return NextResponse.next();
  }

  // Détecter la langue préférée via les headers
  const acceptLanguage = request.headers.get("accept-language") || "";
  let detectedLocale = defaultLocale;

  if (acceptLanguage.includes("ar")) {
    detectedLocale = "ar";
  }

  request.nextUrl.pathname = `/${detectedLocale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
