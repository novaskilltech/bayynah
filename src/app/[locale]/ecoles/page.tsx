interface PageProps {
  params: {
    locale: string;
  };
}

export default function EcolesPage({ params }: PageProps) {
  const isArabic = params.locale === "ar";

  const ecoles = [
    {
      id: "hadith",
      ar: "مدرسة الحديث",
      fr: "École du Hadith",
      desc: "Authentification, isnâd, matn, jarḥ wa taʿdîl.",
    },
    {
      id: "fiqh",
      ar: "مدرسة الفقه",
      fr: "École du Fiqh",
      desc: "Uṣûl al-fiqh, divergence légitime, règles d'inférence.",
    },
    {
      id: "aqida",
      ar: "مدرسة العقيدة",
      fr: "École de la ʿAqîda",
      desc: "Coran, Sunnah, compréhension des Salaf, réunion des textes.",
    },
    {
      id: "critique",
      ar: "مدرسة التفكير النقدي",
      fr: "École de l'Esprit Critique",
      desc: "Détection des biais cognitifs et sophismes fréquents.",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      <div className="border-b border-sable-200 pb-4">
        <h1 className="text-3xl font-bold text-bleuNuit-900">
          {isArabic ? "المدارس الأربع" : "Les 4 Écoles d'apprentissage"}
        </h1>
        <p className="text-sable-500 mt-2">
          {isArabic
            ? "مسارات تكوينية متخصصة لبناء الملكة المنهجية."
            : "Cursus spécialisés pour forger le réflexe méthodologique."}
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {ecoles.map((ecole) => (
          <div
            key={ecole.id}
            className="p-6 rounded-xl border border-sable-200 bg-white shadow-sm hover:border-vertProfond-600 transition"
          >
            <h2 className="text-xl font-bold font-arabic text-vertProfond-700 mb-1">
              {ecole.ar}
            </h2>
            <h3 className="text-base font-semibold text-bleuNuit-900 mb-2">
              {ecole.fr}
            </h3>
            <p className="text-sm text-sable-500">{ecole.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
