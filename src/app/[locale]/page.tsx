interface PageProps {
  params: {
    locale: string;
  };
}

export default function HomePage({ params }: PageProps) {
  const isArabic = params.locale === "ar";

  return (
    <div className="py-12 text-center max-w-3xl mx-auto space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-bleuNuit-900 tracking-tight">
          {isArabic ? "هل ما قيل لك صحيح؟" : "Ce qu’on t’a dit est-il réellement établi ?"}
        </h1>
        <p className="text-lg text-sable-500 max-w-xl mx-auto">
          {isArabic
            ? "تعلّم كيف تتثبت من صحة الدعاوى الدينية قبل قبولها أو نشرها أو الرد عليها."
            : "Apprends à vérifier une affirmation religieuse avant de l’accepter, la transmettre ou la réfuter."}
        </p>
      </div>

      {/* Chaîne fondamentale */}
      <div className="p-4 rounded-xl bg-sable-100/60 border border-sable-200 text-xs sm:text-sm font-medium text-vertProfond-700">
        <span className="font-arabic font-bold">
          الدليل ← صحة النقل ← صحة الفهم ← صحة الاستدلال ← الحكم
        </span>
      </div>

      {/* 3 CTA principaux */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
        <a
          href={`/${params.locale}/methode`}
          className="w-full sm:w-auto px-6 py-3 rounded-lg bg-vertProfond-700 text-white font-semibold hover:bg-vertProfond-800 transition shadow-sm"
        >
          {isArabic ? "تعلّم المنهج" : "Apprendre la méthode"}
        </a>
        <a
          href={`/${params.locale}/laboratoire`}
          className="w-full sm:w-auto px-6 py-3 rounded-lg bg-bleuNuit-900 text-white font-semibold hover:bg-bleuNuit-950 transition shadow-sm"
        >
          {isArabic ? "تحقيق في دعوى" : "Enquêter sur une affirmation"}
        </a>
        <a
          href={`/${params.locale}/ecoles`}
          className="w-full sm:w-auto px-6 py-3 rounded-lg bg-white border border-sable-300 text-bleuNuit-900 font-semibold hover:bg-sable-50 transition shadow-sm"
        >
          {isArabic ? "اختبار التفكير النقدي" : "Tester mon esprit critique"}
        </a>
      </div>
    </div>
  );
}
