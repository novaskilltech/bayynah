import { getDictionary } from "@/lib/dictionary";
import Link from "next/link";
import { BookOpen, FlaskConical, Languages } from "lucide-react";

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function BibliothequePage({ params }: PageProps) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  const isArabic = locale === "ar";

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      <div className="border-b border-sable-200 pb-4">
        <h1 className="text-3xl font-bold text-bleuNuit-900">
          {dict.library.title}
        </h1>
        <p className="text-sable-500 mt-2">
          {dict.library.subtitle}
        </p>
      </div>

      <div className="p-8 rounded-xl border border-sable-200 bg-white text-center space-y-4 shadow-sm">
        <p className="text-sm text-sable-500">
          {dict.library.description}
        </p>
        <p className="text-xs text-sable-400">
          {isArabic
            ? "يجري إعداد الفهرس المرجعي ومراجعته. يمكنك في الأثناء الوصول إلى المصادر الموثقة داخل الدروس والتحقيقات والمعجم."
            : "L’index transversal est en cours de préparation et de revue. Les références déjà validées restent accessibles depuis les leçons, les enquêtes et le lexique."}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href={`/${locale}/ecoles`}
          className="rounded-xl border border-sable-200 bg-white p-5 hover:border-vertProfond-400 transition space-y-2"
        >
          <BookOpen className="w-5 h-5 text-vertProfond-700" />
          <h2 className="font-bold text-bleuNuit-900">{isArabic ? "الدروس" : "Leçons"}</h2>
          <p className="text-xs text-sable-500">
            {isArabic ? "المراجع العلمية ضمن سياق كل درس." : "Les références scientifiques dans leur contexte pédagogique."}
          </p>
        </Link>
        <Link
          href={`/${locale}/laboratoire`}
          className="rounded-xl border border-sable-200 bg-white p-5 hover:border-vertProfond-400 transition space-y-2"
        >
          <FlaskConical className="w-5 h-5 text-vertProfond-700" />
          <h2 className="font-bold text-bleuNuit-900">{isArabic ? "التحقيقات" : "Enquêtes"}</h2>
          <p className="text-xs text-sable-500">
            {isArabic ? "الأدلة الأصلية ومصادر كل قضية." : "Les preuves originales et sources de chaque cas."}
          </p>
        </Link>
        <Link
          href={`/${locale}/lexique`}
          className="rounded-xl border border-sable-200 bg-white p-5 hover:border-vertProfond-400 transition space-y-2"
        >
          <Languages className="w-5 h-5 text-vertProfond-700" />
          <h2 className="font-bold text-bleuNuit-900">{isArabic ? "المعجم" : "Lexique"}</h2>
          <p className="text-xs text-sable-500">
            {isArabic ? "مصطلحات منهجية موثقة ومشروحة." : "Les termes méthodologiques validés et expliqués."}
          </p>
        </Link>
      </div>
    </div>
  );
}
