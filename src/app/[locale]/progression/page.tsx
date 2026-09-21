import ProgressionDashboard from "@/components/skills/ProgressionDashboard";

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function ProgressionPage({ params }: PageProps) {
  const { locale } = await params;
  const isArabic = locale === "ar";

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-8" dir={isArabic ? "rtl" : "ltr"}>
      {/* En-tête */}
      <div className="border-b border-sable-200 pb-6 space-y-2 text-start">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-vertProfond-600" />
          <span className="text-xs font-bold uppercase tracking-widest text-sable-500 font-sans">
            {isArabic ? "لوحة التحكم المنهجية" : "Tableau de Bord"}
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-bleuNuit-900 tracking-tight">
          {isArabic ? "مستوى التمكن من الكفاءات" : "Maîtrise des Compétences"}
        </h1>
        <p className="text-base text-sable-600 max-w-2xl leading-relaxed">
          {isArabic
            ? "تتبع مباشر لمستوى تمكنك من الكفاءات المنهجية الـ14، واكتشف نقاط قوتك والمواطن التي تحتاج إلى مراجعة وتدريب."
            : "Suivi en direct de votre maîtrise des 14 compétences méthodologiques, de vos points forts et de vos axes d'amélioration."}
        </p>
      </div>

      <ProgressionDashboard locale={locale} />
    </div>
  );
}
