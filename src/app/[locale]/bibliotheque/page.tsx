interface PageProps {
  params: {
    locale: string;
  };
}

export default function BibliothequePage({ params }: PageProps) {
  const isArabic = params.locale === "ar";

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      <div className="border-b border-sable-200 pb-4">
        <h1 className="text-3xl font-bold text-bleuNuit-900">
          {isArabic ? "المكتبة المرجعية" : "La Bibliothèque de Référence"}
        </h1>
        <p className="text-sable-500 mt-2">
          {isArabic
            ? "فهرس المصادر والمراجع التراثية المصنفة حسب الأبواب والمستويات."
            : "Index des sources et références patrimoniales classées par domaine et niveau."}
        </p>
      </div>

      <div className="p-8 rounded-xl border border-dashed border-sable-300 bg-white text-center space-y-4">
        <p className="text-sm text-sable-500">
          {isArabic
            ? "المكتبة ستضم مصادر التفسير، الحديث، أصول الفقه، والعقيدة مع روابط الاطلاع القانونية."
            : "La bibliothèque rassemblera les ouvrages fondamentaux (Tafsîr, Hadith, Uṣûl, 'Aqida) avec liens d'accès légaux."}
        </p>
      </div>
    </div>
  );
}
