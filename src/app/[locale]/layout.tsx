import type { Metadata } from "next";
import "../globals.css";
import { getDictionary } from "@/lib/dictionary";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import PilotNoticeFooter from "@/components/PilotNoticeFooter";

export const metadata: Metadata = {
  title: "تَبَيُّن (Tabayyun) — Apprendre à vérifier avant d’affirmer",
  description:
    "Plateforme pédagogique destinée à développer l’esprit critique dans l’étude de la religion selon la méthodologie d’Ahl as-Sunnah wa-l-Jamâʿa",
};

interface RootLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
}

export default async function RootLayout({ children, params }: RootLayoutProps) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  const isArabic = locale === "ar";
  const dir = isArabic ? "rtl" : "ltr";
  const fontClass = isArabic ? "font-arabic" : "font-latin";

  return (
    <html lang={locale} dir={dir}>
      <body className={`bg-ivoire text-bleuNuit-900 min-h-screen ${fontClass} antialiased`}>
        <header className="border-b border-sable-200 bg-white/80 backdrop-blur sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <a href={`/${locale}`} className="text-2xl font-bold font-arabic text-vertProfond-700">
                {dict.common.siteName}
              </a>
              <span className="text-xs uppercase tracking-widest text-sable-500 font-sans hidden sm:inline">
                Tabayyun
              </span>
            </div>

            <nav className="flex items-center gap-5 text-sm font-medium">
              <a href={`/${locale}/methode`} className="hover:text-vertProfond-700 transition">
                {dict.common.nav.method}
              </a>
              <a href={`/${locale}/ecoles`} className="hover:text-vertProfond-700 transition">
                {dict.common.nav.schools}
              </a>
              <a href={`/${locale}/laboratoire`} className="hover:text-vertProfond-700 transition">
                {dict.common.nav.laboratory}
              </a>
              <a href={`/${locale}/parcours`} className="hover:text-vertProfond-700 transition">
                {dict.common.nav.learningPath}
              </a>
              <a href={`/${locale}/progression`} className="hover:text-vertProfond-700 transition">
                {dict.common.nav.progression}
              </a>
              <a href={`/${locale}/revision`} className="hover:text-vertProfond-700 transition">
                {dict.common.nav.revision}
              </a>
              <a href={`/${locale}/compte`} className="hover:text-vertProfond-700 transition font-semibold text-vertProfond-800">
                {dict.common.nav.account || (isArabic ? "حسابي" : "Compte")}
              </a>
            </nav>

            <div className="flex items-center gap-3">
              <LanguageSwitcher currentLocale={locale} />
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>

        <footer className="border-t border-sable-200 py-6 text-center text-xs text-sable-500 mt-16">
          <p>{dict.common.footer}</p>
          <PilotNoticeFooter locale={locale} />
        </footer>
      </body>
    </html>
  );
}
