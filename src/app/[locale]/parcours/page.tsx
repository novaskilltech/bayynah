import LearningPathView from "@/components/skills/LearningPathView";

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function ParcoursPage({ params }: PageProps) {
  const { locale } = await params;
  const isArabic = locale === "ar";

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-8" dir={isArabic ? "rtl" : "ltr"}>
      {/* En-tête */}
      <div className="border-b border-sable-200 pb-6 space-y-2 text-start">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-vertProfond-600" />
          <span className="text-xs font-bold uppercase tracking-widest text-sable-500 font-sans">
            {isArabic ? "منهجية التدرج العلمي" : "Progression Didactique"}
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-bleuNuit-900 tracking-tight">
          {isArabic ? "مسار التعلم المنهجي" : "Parcours d'Apprentissage"}
        </h1>
        <p className="text-base text-sable-600 max-w-2xl leading-relaxed">
          {isArabic
            ? "خريطة طريق متدرجة في خمسة مستويات متكاملة، تضمن بناء الحس النقدي والتمكن من أدوات التثبت خطوة بخطوة."
            : "Une feuille de route en cinq paliers structurés pour construire pas à pas votre rigueur critique et vos réflexes méthodologiques."}
        </p>
      </div>

      <LearningPathView locale={locale} />
    </div>
  );
}
