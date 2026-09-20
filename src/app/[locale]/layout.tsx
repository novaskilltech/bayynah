import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "تَبَيُّن (Bayynah) — Apprendre à vérifier avant d’affirmer",
  description:
    "Plateforme pédagogique destinée à développer l’esprit critique dans l’étude de la religion selon la méthodologie d’Ahl as-Sunnah wa-l-Jamâʿa",
};

interface RootLayoutProps {
  children: React.ReactNode;
  params: {
    locale: string;
  };
}

export default function RootLayout({ children, params }: RootLayoutProps) {
  const isArabic = params.locale === "ar";
  const dir = isArabic ? "rtl" : "ltr";
  const fontClass = isArabic ? "font-arabic" : "font-latin";

  return (
    <html lang={params.locale} dir={dir}>
      <body className={`bg-ivoire text-bleuNuit-900 min-h-screen ${fontClass} antialiased`}>
        <header className="border-b border-sable-200 bg-white/80 backdrop-blur sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold font-arabic text-vertProfond-700">تَبَيَّنْ</span>
              <span className="text-xs uppercase tracking-widest text-sable-500 font-sans hidden sm:inline">
                Bayynah
              </span>
            </div>
            <nav className="flex items-center gap-6 text-sm font-medium">
              <a href={`/${params.locale}/methode`} className="hover:text-vertProfond-700 transition">
                {isArabic ? "المنهج" : "La Méthode"}
              </a>
              <a href={`/${params.locale}/ecoles`} className="hover:text-vertProfond-700 transition">
                {isArabic ? "المدارس" : "Les Écoles"}
              </a>
              <a href={`/${params.locale}/laboratoire`} className="hover:text-vertProfond-700 transition">
                {isArabic ? "المختبر" : "Le Laboratoire"}
              </a>
              <a href={`/${params.locale}/bibliotheque`} className="hover:text-vertProfond-700 transition">
                {isArabic ? "المكتبة" : "Bibliothèque"}
              </a>
            </nav>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>

        <footer className="border-t border-sable-200 py-6 text-center text-xs text-sable-500 mt-16">
          <p>تَبَيُّن — Apprendre à vérifier avant d’affirmer • Ahl as-Sunnah wa-l-Jamâʿa</p>
        </footer>
      </body>
    </html>
  );
}
