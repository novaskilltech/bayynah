import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/dictionary";
import { getAllLessons } from "@/lib/lesson-service";
import { ArrowRight, ArrowLeft, Brain, BookOpen, Scale, Landmark, CheckCircle, ShieldCheck } from "lucide-react";

interface PageProps {
  params: Promise<{
    locale: string;
    school: string;
  }>;
}

const SCHOOLS_DATA: Record<
  string,
  {
    code: string;
    titleFr: string;
    titleAr: string;
    descFr: string;
    descAr: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  critique: {
    code: "CRITIQUE",
    titleFr: "École de l'esprit critique",
    titleAr: "مدرسة التفكير النقدي",
    descFr: "Apprenez à distinguer affirmation et preuve, hiérarchiser les sources et déceler les sophismes.",
    descAr: "التفريق بين الدعوى والدليل، وترتيب مصادر التلقي، وكشف المغالطات في الخطاب الديني.",
    icon: Brain,
  },
  hadith: {
    code: "HADITH",
    titleFr: "École du Hadith",
    titleAr: "مدرسة الحديث",
    descFr: "Comprenez l'isnâd, le matn, le takhrîj et les degrés d'authenticité de la tradition prophétique.",
    descAr: "فهم الإسناد والمتن، وطرق التخريج، ومراتب الصحة والضعف في الرواية النبوية.",
    icon: BookOpen,
  },
  fiqh: {
    code: "FIQH",
    titleFr: "École du Fiqh",
    titleAr: "مدرسة الفقه",
    descFr: "Passez de la preuve textuelle à la déduction juridique et comprenez les causes de divergence.",
    descAr: "من الدليل إلى الحكم، وأسباب اختلاف الفقهاء، وضوابط الاستدلال الفقهي.",
    icon: Scale,
  },
  aqida: {
    code: "AQIDA",
    titleFr: "École de la ʿAqîda",
    titleAr: "مدرسة العقيدة",
    descFr: "Découvrez les fondements scripturaires de la croyance, la compréhension des salaf et l'étude globale.",
    descAr: "أصول الاستدلال العقدي، ومنهج السلف في التلقي، والجمع بين نصوص الباب.",
    icon: Landmark,
  },
};

const LEVEL_NAMES: Record<number, { fr: string; ar: string }> = {
  1: { fr: "Niveau 1 — Mutathabbit (Vérificateur)", ar: "المستوى 1 — مُتَثَبِّت" },
  2: { fr: "Niveau 2 — Bâhith (Chercheur)", ar: "المستوى 2 — بَاحِث" },
  3: { fr: "Niveau 3 — Nâqid (Analyste)", ar: "المستوى 3 — نَاقِد" },
  4: { fr: "Niveau 4 — Tâlib 'Ilm (Étudiant)", ar: "المستوى 4 — طَالِبُ عِلْم" },
};

export default async function SchoolLessonsPage({ params }: PageProps) {
  const { locale, school } = await params;
  const normalizedSchool = school.toLowerCase();
  const schoolMeta = SCHOOLS_DATA[normalizedSchool];

  if (!schoolMeta) {
    notFound();
  }

  const dict = getDictionary(locale);
  const isArabic = locale === "ar";
  const lessons = getAllLessons(schoolMeta.code);
  const Icon = schoolMeta.icon;

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      {/* Fil d'Ariane */}
      <nav className="text-xs text-sable-500 flex items-center gap-2">
        <Link href={`/${locale}`} className="hover:underline">
          {isArabic ? "الرئيسية" : "Accueil"}
        </Link>
        <span>/</span>
        <Link href={`/${locale}/ecoles`} className="hover:underline">
          {dict.common.nav.schools}
        </Link>
        <span>/</span>
        <span className="text-bleuNuit-900 font-semibold">
          {isArabic ? schoolMeta.titleAr : schoolMeta.titleFr}
        </span>
      </nav>

      {/* En-tête de l'école */}
      <div className="rounded-2xl border-2 border-sable-200 bg-white p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-vertProfond-50 border border-vertProfond-200 text-vertProfond-700">
            <Icon className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold font-arabic text-vertProfond-800">
              {schoolMeta.titleAr}
            </h1>
            <h2 className="text-lg sm:text-xl font-bold text-bleuNuit-900">
              {schoolMeta.titleFr}
            </h2>
          </div>
        </div>

        <p className="text-sm sm:text-base text-sable-600 leading-relaxed border-t border-sable-200/60 pt-4">
          {isArabic ? schoolMeta.descAr : schoolMeta.descFr}
        </p>

        <div className="flex items-center gap-3 text-xs text-sable-600 pt-1">
          <span className="font-semibold px-2.5 py-1 rounded-full bg-sable-100 text-bleuNuit-900">
            {lessons.length} {isArabic ? "دروس في هذا المسار" : "leçons dans ce parcours"}
          </span>
          <span className="flex items-center gap-1 text-vertProfond-700">
            <ShieldCheck className="w-4 h-4" />
            <span>{isArabic ? "منهج علمي موثق" : "Méthodologie vérifiée"}</span>
          </span>
        </div>
      </div>

      {/* Liste des leçons */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-bleuNuit-900">
          {isArabic ? "برنامج الدروس" : "Programme des leçons"}
        </h3>

        {lessons.length === 0 ? (
          <div className="rounded-xl border border-dashed border-sable-300 p-8 text-center text-sable-500">
            {isArabic
              ? "الدروس في هذا المسار قيد الإعداد والمراجعة العلمية."
              : "Les leçons de cette école sont actuellement en cours de rédaction et de révision scientifique."}
          </div>
        ) : (
          <div className="grid gap-4">
            {lessons.map((lesson) => {
              const levelMeta = LEVEL_NAMES[lesson.level] || {
                fr: `Niveau ${lesson.level}`,
                ar: `المستوى ${lesson.level}`,
              };

              return (
                <Link
                  key={lesson.id}
                  href={`/${locale}/ecoles/${normalizedSchool}/${lesson.slug}`}
                  className="group block p-5 sm:p-6 rounded-xl border border-sable-200 bg-white hover:border-vertProfond-600 hover:shadow-md transition-all duration-200 space-y-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-bleuNuit-900 text-white text-xs font-bold flex items-center justify-center">
                        {schoolMeta.code[0]}0{lesson.order}
                      </span>
                      <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                        {isArabic ? levelMeta.ar : levelMeta.fr}
                      </span>
                    </div>

                    {lesson.hasQuiz && (
                      <span className="text-xs font-semibold text-vertProfond-700 bg-vertProfond-50 px-2 py-0.5 rounded-full border border-vertProfond-200 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>{isArabic ? "اختبار متوفر" : "Quiz inclus"}</span>
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="text-lg font-bold text-bleuNuit-950 group-hover:text-vertProfond-700 transition">
                      {isArabic ? lesson.titleAr : lesson.titleFr}
                    </h4>
                    {isArabic && (
                      <p className="text-xs text-sable-500 font-arabic mt-0.5">
                        {lesson.titleFr}
                      </p>
                    )}
                  </div>

                  <p className="text-sm text-sable-600 leading-relaxed line-clamp-2">
                    {isArabic ? lesson.summaryAr : lesson.summaryFr}
                  </p>

                  <div className="pt-2 border-t border-sable-100 flex items-center justify-between text-xs">
                    <div className="text-vertProfond-800 font-medium italic">
                      « {isArabic ? lesson.methodologyPrincipleAr : lesson.methodologyPrincipleFr} »
                    </div>

                    <div className="flex items-center gap-1 text-vertProfond-700 font-semibold group-hover:underline">
                      <span>{isArabic ? "ابدأ الدرس" : "Commencer"}</span>
                      {isArabic ? (
                        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                      ) : (
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
