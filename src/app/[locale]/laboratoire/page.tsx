interface PageProps {
  params: {
    locale: string;
  };
}

export default function LaboratoirePage({ params }: PageProps) {
  const isArabic = params.locale === "ar";

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      <div className="border-b border-sable-200 pb-4">
        <h1 className="text-3xl font-bold text-bleuNuit-900">
          {isArabic ? "المختبر — معمل التحقيق في الدعاوى" : "Le Laboratoire — Enquête pas-à-pas"}
        </h1>
        <p className="text-sable-500 mt-2">
          {isArabic
            ? "تدرب على تفكيك الدعاوى الدينية وكشف أدلتها خطوة بخطوة."
            : "Entraîne-toi à décortiquer une affirmation religieuse et examiner ses preuves étape par étape."}
        </p>
      </div>

      <div className="p-8 rounded-xl border border-dashed border-sable-300 bg-white text-center space-y-4">
        <div className="inline-block p-3 rounded-full bg-sable-100 text-vertProfond-700 font-arabic text-xl font-bold">
          المختبر
        </div>
        <h2 className="text-xl font-semibold text-bleuNuit-900">
          {isArabic ? "10 تحقيقات تفاعلية قيد الإعداد" : "10 Enquêtes interactives en cours d'intégration"}
        </h2>
        <p className="text-sm text-sable-500 max-w-md mx-auto">
          {isArabic
            ? "النموذج الهيكلي جاهز لاستقبال ملفات التحقيق المعتمدة."
            : "L'échafaudage est prêt à accueillir les fichiers de cas méthodologiques rédigés."}
        </p>
      </div>
    </div>
  );
}
