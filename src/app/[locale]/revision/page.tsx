import AdaptiveReviewView from "@/components/skills/AdaptiveReviewView";

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function RevisionPage({ params }: PageProps) {
  const { locale } = await params;
  const isArabic = locale === "ar";

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-8" dir={isArabic ? "rtl" : "ltr"}>
      {/* En-tête */}
      <div className="border-b border-sable-200 pb-6 space-y-2 text-start">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-600" />
          <span className="text-xs font-bold uppercase tracking-widest text-sable-500 font-sans">
            {isArabic ? "المراجعة والتصحيح" : "Auto-Correction"}
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-bleuNuit-900 tracking-tight">
          {isArabic ? "مراجعة الأخطاء والهنات المنهجية" : "Mode Révision Adaptative"}
        </h1>
        <p className="text-base text-sable-600 max-w-2xl leading-relaxed">
          {isArabic
            ? "جلسة مراجعة ذكية تركز على الكفاءات التي شهدت تكراراً في التعجل أو النقص، مع روابط مباشرة للدروس وخطوات التحقيق المعملية."
            : "Une session ciblée qui identifie vos points d'hésitation et vous propose les ressources exactes pour combler les lacunes."}
        </p>
      </div>

      <AdaptiveReviewView locale={locale} />
    </div>
  );
}
