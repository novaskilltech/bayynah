import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getDictionary } from "@/lib/dictionary";
import { getLessonBySlug, getAdjacentLessons, getAllLessons } from "@/lib/lesson-service";
import HistoricReferenceCard from "@/components/lessons/HistoricReferenceCard";
import LessonQuiz from "@/components/lessons/LessonQuiz";
import LessonContent from "@/components/lessons/LessonContent";
import { ArrowLeft, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { isLessonSlug } from "@/lib/telemetry-contract";

interface PageProps {
  params: Promise<{
    locale: string;
    school: string;
    slug: string;
  }>;
}

const LEVEL_NAMES: Record<number, { fr: string; ar: string }> = {
  1: { fr: "Niveau 1 — Mutathabbit (Vérificateur)", ar: "المستوى 1 — مُتَثَبِّت" },
  2: { fr: "Niveau 2 — Bâhith (Chercheur)", ar: "المستوى 2 — بَاحِث" },
  3: { fr: "Niveau 3 — Nâqid (Analyste)", ar: "المستوى 3 — نَاقِد" },
  4: { fr: "Niveau 4 — Tâlib 'Ilm (Étudiant)", ar: "المستوى 4 — طَالِبُ عِلْم" },
};

export function generateStaticParams() {
  const allLessons = getAllLessons();
  return allLessons.map((l) => ({
    school: l.school.toLowerCase(),
    slug: l.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, school, slug } = await params;
  const lesson = getLessonBySlug(slug);

  if (!lesson || lesson.school.toLowerCase() !== school.toLowerCase()) {
    return {
      title: "Leçon non trouvée — تَبَيُّن",
      robots: { index: false, follow: false },
    };
  }

  const isArabic = locale === "ar";
  return {
    title: `${isArabic ? lesson.titleAr : lesson.titleFr} — تَبَيُّن (Tabayyun)`,
    description: isArabic ? lesson.summaryAr : lesson.summaryFr,
  };
}

export default async function SingleLessonPage({ params }: PageProps) {
  const { locale, school, slug } = await params;
  const lesson = getLessonBySlug(slug);

  // Vérifier que la leçon existe et appartient bien à l'école demandée
  if (!lesson || lesson.school.toLowerCase() !== school.toLowerCase()) {
    notFound();
  }

  const dict = getDictionary(locale);
  const isArabic = locale === "ar";
  const { prev, next } = getAdjacentLessons(lesson.school, lesson.slug);

  const levelMeta = LEVEL_NAMES[lesson.level] || {
    fr: `Niveau ${lesson.level}`,
    ar: `المستوى ${lesson.level}`,
  };

  return (
    <article className="max-w-4xl mx-auto py-8 space-y-8">
      {/* 1. Fil d'Ariane */}
      <nav className="text-xs text-sable-500 flex items-center gap-2" aria-label="Fil d'Ariane">
        <Link href={`/${locale}`} className="hover:underline">
          {isArabic ? "الرئيسية" : "Accueil"}
        </Link>
        <span>/</span>
        <Link href={`/${locale}/ecoles`} className="hover:underline">
          {dict.common.nav.schools}
        </Link>
        <span>/</span>
        <Link href={`/${locale}/ecoles/${school}`} className="hover:underline capitalize">
          {school}
        </Link>
        <span>/</span>
        <span className="text-bleuNuit-900 font-semibold truncate max-w-xs">
          {isArabic ? lesson.titleAr : lesson.titleFr}
        </span>
      </nav>

      {/* En-tête de la leçon */}
      <header className="rounded-2xl border-2 border-sable-200 bg-white p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sable-200 pb-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-lg bg-bleuNuit-900 text-white text-xs font-bold">
              {lesson.school[0]}0{lesson.order}
            </span>
            {/* 4. Niveau */}
            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
              {isArabic ? levelMeta.ar : levelMeta.fr}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-vertProfond-700">
            <ShieldCheck className="w-4 h-4" />
            <span>{isArabic ? "مراجعة علمية مسجلة" : "Révision scientifique enregistrée"}</span>
          </div>
        </div>

        {/* 2. Titre & 3. Résumé */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold font-arabic text-vertProfond-800 leading-tight">
            {lesson.titleAr}
          </h1>
          <h2 className="text-xl sm:text-2xl font-bold text-bleuNuit-950">
            {lesson.titleFr}
          </h2>
          <p className="text-sm sm:text-base text-sable-600 leading-relaxed pt-2">
            {isArabic ? lesson.summaryAr : lesson.summaryFr}
          </p>
        </div>

        {/* 5. Principe méthodologique */}
        <div className="rounded-xl bg-vertProfond-50/70 border border-vertProfond-200 p-4 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-vertProfond-600 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-vertProfond-800">
              {isArabic ? "القاعدة المنهجية الحاكمة" : "Principe méthodologique cardinal"}
            </span>
            <p className="text-base sm:text-lg font-arabic font-bold text-bleuNuit-950" dir="rtl">
              {lesson.methodologyPrincipleAr}
            </p>
            <p className="text-xs sm:text-sm text-sable-700 italic">
              « {lesson.methodologyPrincipleFr} »
            </p>
          </div>
        </div>
      </header>

      {/* 6. Corps de la leçon */}
      <section className="rounded-2xl border border-sable-200 bg-white p-6 sm:p-8 shadow-sm" aria-label="Corps de la leçon">
        <LessonContent content={lesson.content} locale={locale} />
      </section>

      {/* 7. Fiche de citation historique de référence */}
      {lesson.historicReference && (
        <section aria-label="Référence historique vérifiée">
          <HistoricReferenceCard reference={lesson.historicReference} locale={locale} />
        </section>
      )}

      {/* 8. Quiz interactif */}
      {lesson.quizzes && lesson.quizzes.length > 0 && isLessonSlug(lesson.slug) && (
        <section aria-label="Exercice méthodologique">
          <LessonQuiz quizzes={lesson.quizzes} lessonSlug={lesson.slug} locale={locale} />
        </section>
      )}

      {/* 9. Navigation précédente / suivante (strictement dans la même école) */}
      <nav className="flex items-center justify-between gap-4 pt-4 border-t border-sable-200" aria-label="Navigation entre leçons">
        {prev ? (
          <Link
            href={`/${locale}/ecoles/${school}/${prev.slug}`}
            className="group flex items-center gap-2 px-4 py-3 rounded-xl border border-sable-300 bg-white hover:border-vertProfond-600 transition text-sm font-semibold text-bleuNuit-900 focus:ring-2 focus:ring-vertProfond-500 focus:outline-none"
          >
            {isArabic ? (
              <ArrowRight className="w-4 h-4 text-sable-500 group-hover:text-vertProfond-700 group-hover:translate-x-1 transition-transform" />
            ) : (
              <ArrowLeft className="w-4 h-4 text-sable-500 group-hover:text-vertProfond-700 group-hover:-translate-x-1 transition-transform" />
            )}
            <div className="text-start">
              <span className="block text-xs text-sable-500 font-normal">
                {isArabic ? "الدرس السابق" : "Leçon précédente"}
              </span>
              <span className="truncate max-w-[160px] sm:max-w-xs block">
                {isArabic ? prev.titleAr : prev.titleFr}
              </span>
            </div>
          </Link>
        ) : (
          <div />
        )}

        {next ? (
          <Link
            href={`/${locale}/ecoles/${school}/${next.slug}`}
            className="group flex items-center gap-2 px-4 py-3 rounded-xl border border-sable-300 bg-white hover:border-vertProfond-600 transition text-sm font-semibold text-bleuNuit-900 focus:ring-2 focus:ring-vertProfond-500 focus:outline-none"
          >
            <div className="text-end">
              <span className="block text-xs text-sable-500 font-normal">
                {isArabic ? "الدرس الموالي" : "Leçon suivante"}
              </span>
              <span className="truncate max-w-[160px] sm:max-w-xs block">
                {isArabic ? next.titleAr : next.titleFr}
              </span>
            </div>
            {isArabic ? (
              <ArrowLeft className="w-4 h-4 text-sable-500 group-hover:text-vertProfond-700 group-hover:-translate-x-1 transition-transform" />
            ) : (
              <ArrowRight className="w-4 h-4 text-sable-500 group-hover:text-vertProfond-700 group-hover:translate-x-1 transition-transform" />
            )}
          </Link>
        ) : (
          <div />
        )}
      </nav>
    </article>
  );
}
