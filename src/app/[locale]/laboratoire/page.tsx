import Link from "next/link";
import { getDictionary } from "@/lib/dictionary";
import { getAllInquiries } from "@/lib/inquiry-service";
import { ArrowRight, ArrowLeft, BookOpen, Layers, Target } from "lucide-react";

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function LaboratoirePage({ params }: PageProps) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  const isArabic = locale === "ar";
  const inquiries = getAllInquiries();

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-10" dir={isArabic ? "rtl" : "ltr"}>
      {/* En-tête de la page */}
      <div className="border-b border-sable-200 pb-6 space-y-2">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-vertProfond-600" />
          <span className="text-xs font-bold uppercase tracking-widest text-sable-500 font-sans">
            {isArabic ? "معمل التحقيق التفاعلي" : "Laboratoire d'Investigation"}
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-bleuNuit-900 tracking-tight">
          {dict.laboratory.title}
        </h1>
        <p className="text-base text-sable-500 max-w-2xl">
          {dict.laboratory.subtitle}
        </p>
      </div>

      {/* Liste des enquêtes interactives disponibles */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-bleuNuit-900">
            {isArabic ? "قضايا التحقيق المتاحة" : "Enquêtes méthodologiques disponibles"}
          </h2>
          <span className="text-xs font-semibold text-sable-500 bg-sable-100 px-2.5 py-1 rounded-full">
            {inquiries.length} {isArabic ? "قضية" : "enquête(s)"}
          </span>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {inquiries.map((inq) => (
            <div
              key={inq.id}
              className="rounded-2xl border border-sable-200 bg-white p-6 shadow-sm hover:border-vertProfond-600 hover:shadow-md transition flex flex-col justify-between space-y-6"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-1 rounded text-xs font-bold bg-sable-100 text-vertProfond-800">
                    {inq.domain}
                  </span>
                  <span className="text-[11px] font-semibold text-sable-400 font-sans">
                    {inq.stepsCount} {isArabic ? "خطوات" : "étapes"} • {inq.evidencesCount} {isArabic ? "أدلة" : "preuves"}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-bleuNuit-900 leading-snug">
                  {isArabic ? inq.title.ar : inq.title.fr}
                </h3>

                <p className="text-xs text-sable-500 line-clamp-2 italic bg-sable-50 p-2.5 rounded-lg border border-sable-100">
                  « {isArabic ? inq.initialClaim.ar : inq.initialClaim.fr} »
                </p>
              </div>

              <div className="pt-4 border-t border-sable-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-sable-500">
                  {isArabic ? "الحالة: تجريبي" : "Cas pilote"}
                </span>

                <Link
                  href={`/${locale}/laboratoire/${inq.slug}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-vertProfond-700 hover:bg-vertProfond-800 text-white text-xs font-bold transition shadow-xs"
                >
                  <span>{isArabic ? "بدء التحقيق" : "Démarrer l'enquête"}</span>
                  {isArabic ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
