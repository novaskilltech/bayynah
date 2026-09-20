interface PageProps {
  params: {
    locale: string;
  };
}

export default function MethodePage({ params }: PageProps) {
  const isArabic = params.locale === "ar";

  const steps = [
    { num: 1, ar: "ما الدعوى؟", fr: "Quelle est exactement l'affirmation ?" },
    { num: 2, ar: "ما نوع المسألة؟", fr: "De quel domaine relève-t-elle ?" },
    { num: 3, ar: "ما المصدر؟", fr: "Quelle est la source originale ?" },
    { num: 4, ar: "هل ثبت النقل؟", fr: "L'attribution est-elle authentique ?" },
    { num: 5, ar: "ماذا يعني النص؟", fr: "Que signifie réellement le texte ?" },
    { num: 6, ar: "هل توجد نصوص أخرى؟", fr: "Existe-t-il d'autres preuves sur le sujet ?" },
    { num: 7, ar: "كيف فهمه السلف؟", fr: "Comment les premières générations l'ont-elles compris ?" },
    { num: 8, ar: "هل هناك إجماع أو خلاف؟", fr: "Existe-t-il un consensus ou une divergence ?" },
    { num: 9, ar: "ما وجه الاستدلال؟", fr: "Comment la preuve conduit-elle au jugement ?" },
    { num: 10, ar: "ما درجة اليقين؟", fr: "Quel est réellement notre degré de certitude ?" },
  ];

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      <div className="border-b border-sable-200 pb-4">
        <h1 className="text-3xl font-bold text-bleuNuit-900">
          {isArabic ? "المنهج — الأسئلة العشرة قبل تصديق أي دعوى" : "La Méthode — Les 10 questions avant de croire une affirmation"}
        </h1>
        <p className="text-sable-500 mt-2">
          {isArabic
            ? "خطوات التثبت العلمي وفق منهج أهل السنة والجماعة."
            : "Les étapes de vérification méthodique selon la tradition d'Ahl as-Sunnah wa-l-Jamâʿa."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {steps.map((step) => (
          <div
            key={step.num}
            className="p-5 rounded-lg border border-sable-200 bg-white shadow-sm hover:border-vertProfond-600 transition"
          >
            <div className="flex items-center gap-3 text-vertProfond-700 font-bold text-lg mb-2">
              <span className="w-8 h-8 rounded-full bg-sable-100 flex items-center justify-center text-sm font-sans">
                {step.num}
              </span>
              <span className="font-arabic">{step.ar}</span>
            </div>
            <p className="text-sm text-bleuNuit-800 font-medium">{step.fr}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
