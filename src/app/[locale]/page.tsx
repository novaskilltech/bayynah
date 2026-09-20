import { getDictionary } from "@/lib/dictionary";

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  const dict = getDictionary(locale);

  return (
    <div className="py-12 text-center max-w-3xl mx-auto space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-bleuNuit-900 tracking-tight">
          {dict.home.title}
        </h1>
        <p className="text-lg text-sable-500 max-w-xl mx-auto">
          {dict.home.subtitle}
        </p>
      </div>

      {/* Chaîne fondamentale */}
      <div className="p-4 rounded-xl bg-sable-100/60 border border-sable-200 text-xs sm:text-sm font-medium text-vertProfond-700">
        <span className="font-arabic font-bold text-base block mb-1">
          الدليل ← صحة النقل ← صحة الفهم ← صحة الاستدلال ← الحكم
        </span>
        <span className="text-xs text-sable-500 font-sans">
          {dict.home.fundamentalChain}
        </span>
      </div>

      {/* 3 CTA principaux */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
        <a
          href={`/${locale}/methode`}
          className="w-full sm:w-auto px-6 py-3 rounded-lg bg-vertProfond-700 text-white font-semibold hover:bg-vertProfond-800 transition shadow-sm"
        >
          {dict.home.ctaMethod}
        </a>
        <a
          href={`/${locale}/laboratoire`}
          className="w-full sm:w-auto px-6 py-3 rounded-lg bg-bleuNuit-900 text-white font-semibold hover:bg-bleuNuit-950 transition shadow-sm"
        >
          {dict.home.ctaLab}
        </a>
        <a
          href={`/${locale}/ecoles`}
          className="w-full sm:w-auto px-6 py-3 rounded-lg bg-white border border-sable-300 text-bleuNuit-900 font-semibold hover:bg-sable-50 transition shadow-sm"
        >
          {dict.home.ctaTest}
        </a>
      </div>
    </div>
  );
}
