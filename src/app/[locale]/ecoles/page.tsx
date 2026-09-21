import Link from "next/link";
import { getDictionary } from "@/lib/dictionary";
import { getSchoolCounts } from "@/lib/lesson-service";
import { ArrowRight, ArrowLeft, Brain, BookOpen, Scale, Landmark } from "lucide-react";

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function EcolesPage({ params }: PageProps) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  const isArabic = locale === "ar";
  const counts = getSchoolCounts();

  const schoolsMetadata: Record<
    string,
    { icon: React.ComponentType<{ className?: string }>; color: string; href: string }
  > = {
    critique: {
      icon: Brain,
      color: "bg-amber-100 text-amber-800 border-amber-300",
      href: `/${locale}/ecoles/critique`,
    },
    hadith: {
      icon: BookOpen,
      color: "bg-emerald-100 text-emerald-800 border-emerald-300",
      href: `/${locale}/ecoles/hadith`,
    },
    fiqh: {
      icon: Scale,
      color: "bg-blue-100 text-blue-800 border-blue-300",
      href: `/${locale}/ecoles/fiqh`,
    },
    aqida: {
      icon: Landmark,
      color: "bg-purple-100 text-purple-800 border-purple-300",
      href: `/${locale}/ecoles/aqida`,
    },
  };

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      {/* En-tête */}
      <div className="border-b border-sable-200 pb-6 space-y-2">
        <h1 className="text-3xl font-bold text-bleuNuit-900 font-arabic">
          {dict.schools.title}
        </h1>
        <p className="text-sable-600 text-base leading-relaxed">
          {dict.schools.subtitle}
        </p>
      </div>

      {/* Grille des 4 écoles */}
      <div className="grid gap-6 sm:grid-cols-2">
        {dict.schools.items.map((ecole) => {
          const meta = schoolsMetadata[ecole.id] || {
            icon: Brain,
            color: "bg-sable-100 text-sable-800 border-sable-300",
            href: `/${locale}/ecoles/${ecole.id}`,
          };
          const Icon = meta.icon;
          const lessonCount = counts[ecole.id.toUpperCase()] || 0;

          return (
            <Link
              key={ecole.id}
              href={meta.href}
              className="group block p-6 rounded-2xl border-2 border-sable-200 bg-white shadow-sm hover:border-vertProfond-600 hover:shadow-md transition-all duration-200 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-xl border ${meta.color}`}>
                  <Icon className="w-6 h-6" />
                </div>

                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                    lessonCount > 0
                      ? "bg-vertProfond-50 text-vertProfond-700 border-vertProfond-200"
                      : "bg-sable-100 text-sable-500 border-sable-200"
                  }`}
                >
                  {lessonCount > 0
                    ? `${lessonCount} ${isArabic ? "دروس متاحة" : "leçons disponibles"}`
                    : isArabic
                    ? "قريباً"
                    : "À venir"}
                </span>
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl font-bold font-arabic text-vertProfond-700 group-hover:text-vertProfond-800 transition">
                  {ecole.titleAr}
                </h2>
                <h3 className="text-lg font-bold text-bleuNuit-900">
                  {ecole.title}
                </h3>
              </div>

              <p className="text-sm text-sable-600 leading-relaxed">
                {ecole.description}
              </p>

              <div className="pt-2 flex items-center text-sm font-semibold text-vertProfond-700 group-hover:text-vertProfond-800 gap-2">
                <span>{isArabic ? "استكشف الدروس" : "Explorer les leçons"}</span>
                {isArabic ? (
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                ) : (
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
