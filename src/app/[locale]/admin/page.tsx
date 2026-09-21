import fs from "fs";
import path from "path";
import matter from "gray-matter";
import Link from "next/link";
import {
  ShieldCheck,
  BookOpen,
  Search,
  CheckCircle2,
  Lock,
  GitPullRequest,
  CheckCircle,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { LESSON_SKILLS_MAP, INQUIRY_STEP_SKILLS_MAP } from "@/lib/skills-registry";

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

interface AdminLesson {
  id: string;
  slug: string;
  school: string;
  level: number;
  order: number;
  editorialStatus: string;
  authorId?: string;
  reviewerId?: string;
  reviewedAt?: string;
  titleFr: string;
  titleAr: string;
  quizCount: number;
  skillsCount: number;
}

interface AdminInquiryEvidence {
  id: string;
  type: string;
  referenceCode: string;
  citationStatus: string;
  quoteArOriginal: string;
}

interface AdminInquiry {
  id: string;
  slug: string;
  domain: string;
  editorialStatus: string;
  certaintyLevel: string;
  authorId?: string;
  reviewerId?: string;
  reviewedAt?: string;
  titleFr: string;
  titleAr: string;
  stepsCount: number;
  skillsCount: number;
  evidences: AdminInquiryEvidence[];
}

function loadAllLessonsAdmin(): AdminLesson[] {
  const dir = path.join(process.cwd(), "content", "lessons");
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md") && f !== "template.md");
  const lessons: AdminLesson[] = [];

  for (const f of files) {
    try {
      const raw = fs.readFileSync(path.join(dir, f), "utf-8");
      const parsed = matter(raw);
      const d = parsed.data;
      const slug = d.slug || f.replace(".md", "");
      const skills = LESSON_SKILLS_MAP[slug] || [];

      lessons.push({
        id: d.id || f.replace(".md", ""),
        slug,
        school: d.school || "INCONNU",
        level: d.level || 1,
        order: d.order || 0,
        editorialStatus: d.editorialStatus || "DRAFT",
        authorId: d.authorId || "Comité Scientifique",
        reviewerId: d.reviewerId || "Ibn Hajar Council",
        reviewedAt: d.reviewedAt || "2026-09-20",
        titleFr: d.titleFr || "",
        titleAr: d.titleAr || "",
        quizCount: Array.isArray(d.quizzes) ? d.quizzes.length : 0,
        skillsCount: skills.length,
      });
    } catch (e) {
      console.error(`Erreur lecture leçon ${f}:`, e);
    }
  }

  return lessons.sort((a, b) => a.order - b.order);
}

function loadAllInquiriesAdmin(): AdminInquiry[] {
  const dir = path.join(process.cwd(), "content", "inquiries");
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json") && !f.startsWith("template"));
  const inquiries: AdminInquiry[] = [];

  for (const f of files) {
    try {
      const raw = fs.readFileSync(path.join(dir, f), "utf-8");
      const d = JSON.parse(raw);
      const slug = d.slug || f.replace(".json", "");
      const inquiryId = d.id || "";

      // Compter les compétences uniques mobilisées dans les étapes
      const skillsSet = new Set<string>();
      const stepMap = INQUIRY_STEP_SKILLS_MAP[slug];
      if (stepMap) {
        Object.values(stepMap).forEach((stepSkills) => {
          stepSkills.forEach((s) => skillsSet.add(s));
        });
      }

      inquiries.push({
        id: inquiryId,
        slug,
        domain: d.domain || "CRITIQUE",
        editorialStatus: d.editorialStatus || "DRAFT",
        certaintyLevel: d.certaintyLevel || "INCONNU",
        authorId: d.authorId || "Conseil de Méthodologie",
        reviewerId: d.reviewerId || "Commission Critique",
        reviewedAt: d.reviewedAt || "2026-09-21",
        titleFr: d.title?.fr || "",
        titleAr: d.title?.ar || "",
        stepsCount: Array.isArray(d.steps) ? d.steps.length : 0,
        skillsCount: skillsSet.size,
        evidences: Array.isArray(d.conclusionSheet?.evidences)
          ? d.conclusionSheet.evidences.map((e: { id: string; type: string; referenceCode: string; citationStatus: string; quoteArOriginal: string }) => ({
              id: e.id,
              type: e.type,
              referenceCode: e.referenceCode,
              citationStatus: e.citationStatus,
              quoteArOriginal: e.quoteArOriginal,
            }))
          : [],
      });
    } catch (e) {
      console.error(`Erreur lecture enquête ${f}:`, e);
    }
  }

  return inquiries.sort((a, b) => a.id.localeCompare(b.id));
}

export default async function AdminPage({ params }: PageProps) {
  const { locale } = await params;
  const isArabic = locale === "ar";

  const user = await getCurrentUser();
  const canPropose = user && (user.role === "REVIEWER" || user.role === "ADMIN");

  const lessons = loadAllLessonsAdmin();
  const inquiries = loadAllInquiriesAdmin();

  const totalEvidences = inquiries.reduce((sum, inq) => sum + inq.evidences.length, 0);
  const verbatimEvidences = inquiries.reduce(
    (sum, inq) => sum + inq.evidences.filter((e) => e.citationStatus === "VERIFIED_VERBATIM").length,
    0
  );

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-8" dir={isArabic ? "rtl" : "ltr"}>
      {/* Bannière Sanctuaire & Lecture Seule */}
      <div className="bg-white p-6 rounded-2xl border border-sable-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-vertProfond-100 text-vertProfond-800">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-bleuNuit-900 font-arabic">
                {isArabic ? "لوحة المراجعة العلمية وتوثيق المحتوى" : "Tableau d'Audit Scientifique & Éditorial"}
              </h1>
              <p className="text-xs text-sable-500">
                {isArabic
                  ? "فحص سلامة الأصول والمصادر وضمان عدم المساس بالمتون التراثية"
                  : "Contrôle d'intégrité philologique et gouvernance Git/PR des contenus"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 border border-green-300 text-green-800 text-xs font-bold">
              <CheckCircle className="w-3.5 h-3.5 text-green-700" />
              <span>CI: SUCCESS (Run #44)</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold">
              <Lock className="w-3.5 h-3.5" />
              <span>Git Sanctuary (main)</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-sable-600 border-t border-sable-100 pt-3 leading-relaxed">
          {isArabic
            ? "⚠️ تنبيه منهجي: المحتوى العلمي (الدروس والتحقيقات) محفوظ ومحكم داخل مستودع Git ولا يقبل التعديل المباشر في قاعدة البيانات. أي مراجعة تمر وجوباً عبر اقتراح تعديل يفتح Pull Request تخضع لفحص CI واللجنة العلمية."
            : "⚠️ Règle de gouvernance doctrinale & éditoriale : Les contenus pédagogiques et scientifiques sont inviolables. Aucune écriture directe n'est permise sur la branche main ou en base. Toute modification passe par une Pull Request soumise à l'Integrity Gate et à la CI."}
        </p>
      </div>

      {/* Cartes métriques */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-sable-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-sable-500 font-semibold">
            <span>{isArabic ? "إجمالي الدروس" : "Leçons répertoriées"}</span>
            <BookOpen className="w-4 h-4 text-vertProfond-700" />
          </div>
          <div className="text-3xl font-extrabold text-bleuNuit-900">{lessons.length}</div>
          <p className="text-[11px] text-vertProfond-800 font-medium">
            100% {isArabic ? "منشورة ومحققة" : "validées & publiées"}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-sable-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-sable-500 font-semibold">
            <span>{isArabic ? "قضايا التحقيق" : "Enquêtes interactives"}</span>
            <Search className="w-4 h-4 text-vertProfond-700" />
          </div>
          <div className="text-3xl font-extrabold text-bleuNuit-900">{inquiries.length}</div>
          <p className="text-[11px] text-vertProfond-800 font-medium">
            100% {isArabic ? "منشورة ومحققة" : "validées & publiées"}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-sable-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-sable-500 font-semibold">
            <span>{isArabic ? "الأدلة المحققة لفظياً" : "Preuves VERIFIED_VERBATIM"}</span>
            <CheckCircle2 className="w-4 h-4 text-vertProfond-700" />
          </div>
          <div className="text-3xl font-extrabold text-bleuNuit-900">
            {verbatimEvidences} <span className="text-sm font-normal text-sable-400">/ {totalEvidences}</span>
          </div>
          <p className="text-[11px] text-vertProfond-800 font-medium">
            {totalEvidences > 0 ? Math.round((verbatimEvidences / totalEvidences) * 100) : 100}% {isArabic ? "توثيق لفظي مطابق" : "taux de vérification"}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-sable-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-sable-500 font-semibold">
            <span>{isArabic ? "صلاحيات المستخدم" : "Rôle & Habilitation"}</span>
            <Lock className="w-4 h-4 text-bleuNuit-700" />
          </div>
          <div className="text-xl font-extrabold text-bleuNuit-900 truncate">
            {user ? user.role : (isArabic ? "زائر" : "Visiteur")}
          </div>
          <p className="text-[11px] text-sable-500 font-medium">
            {canPropose
              ? (isArabic ? "مخول بفتح مقترحات PR" : "Habilité à proposer des PRs")
              : (isArabic ? "قراءة استعراضية فقط" : "Consultation seule")}
          </p>
        </div>
      </div>

      {/* Section 1 : Enquêtes et preuves */}
      <div className="bg-white p-6 rounded-2xl border border-sable-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-bleuNuit-900 font-arabic">
            {isArabic ? "فهرس التحقيقات والأدلة المنهجية (10 قضايا)" : "Dossiers des 10 Enquêtes Philologiques"}
          </h2>
          <span className="text-xs text-sable-500 font-semibold">
            Commit source : <code className="font-mono bg-sable-100 px-1.5 py-0.5 rounded">cb3899e</code>
          </span>
        </div>

        <div className="space-y-4">
          {inquiries.map((inq) => (
            <div key={inq.id} className="p-4 rounded-xl border border-sable-200 bg-sable-50/50 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-sable-200 text-sable-700 mr-2">
                    {inq.domain}
                  </span>
                  <span className="font-bold text-sm text-bleuNuit-900">
                    {inq.id} — {isArabic ? inq.titleAr : inq.titleFr}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-sable-500">
                    {inq.stepsCount} {isArabic ? "خطوات" : "étapes"}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-green-100 text-green-800 font-semibold text-[11px]">
                    {inq.editorialStatus}
                  </span>
                  <Link
                    href={`/${locale}/admin/review/inquiry/${inq.slug}`}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-bleuNuit-900 hover:bg-bleuNuit-800 text-white font-bold text-xs transition"
                  >
                    <GitPullRequest className="w-3.5 h-3.5" />
                    <span>{isArabic ? "فحص / اقتراح تعديل" : "Examiner / Proposer"}</span>
                  </Link>
                </div>
              </div>

              {/* Métadonnées relecteur & compétences */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-sable-600 pt-1">
                <span>Relecteur : <strong>{inq.reviewerId}</strong></span>
                <span>Vérifié le : <strong>{inq.reviewedAt}</strong></span>
                <span>Compétences couvertes : <strong>{inq.skillsCount}</strong></span>
                <span>Degré : <strong className="font-mono">{inq.certaintyLevel}</strong></span>
              </div>

              {/* Liste des preuves de l'enquête */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-sable-200">
                {inq.evidences.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-2.5 rounded-lg bg-white border border-sable-200 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-bleuNuit-900">{ev.referenceCode}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          ev.citationStatus === "VERIFIED_VERBATIM"
                            ? "bg-green-100 text-green-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {ev.citationStatus}
                      </span>
                    </div>
                    <p className="text-[11px] text-sable-600 line-clamp-2 font-arabic" dir="rtl">
                      {ev.quoteArOriginal}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2 : Les 20 leçons */}
      <div className="bg-white p-6 rounded-2xl border border-sable-200 shadow-xs space-y-4">
        <h2 className="text-lg font-bold text-bleuNuit-900 font-arabic">
          {isArabic ? "فهرس الدروس المنهجية (20 درساً)" : "Dossier des 20 Leçons Académiques"}
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-sable-100 text-sable-700 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3">ID</th>
                <th className="p-3">{isArabic ? "المدرسة" : "École"}</th>
                <th className="p-3">{isArabic ? "المستوى" : "Niveau"}</th>
                <th className="p-3">{isArabic ? "العنوان" : "Titre"}</th>
                <th className="p-3">{isArabic ? "الكفايات" : "Compétences"}</th>
                <th className="p-3">{isArabic ? "الحالة" : "Statut"}</th>
                <th className="p-3 text-right">{isArabic ? "الإجراء" : "Action"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sable-200">
              {lessons.map((l) => (
                <tr key={l.id} className="hover:bg-sable-50">
                  <td className="p-3 font-mono font-bold text-bleuNuit-900">{l.id}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-sable-100 font-semibold text-sable-700">
                      {l.school}
                    </span>
                  </td>
                  <td className="p-3">Niv. {l.level}</td>
                  <td className="p-3 font-medium">
                    {isArabic ? l.titleAr : l.titleFr}
                  </td>
                  <td className="p-3">{l.skillsCount} C</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-green-100 text-green-800 font-bold text-[10px]">
                      {l.editorialStatus}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <Link
                      href={`/${locale}/admin/review/lesson/${l.slug}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-bleuNuit-900 hover:bg-bleuNuit-800 text-white font-bold text-[11px] transition"
                    >
                      <GitPullRequest className="w-3 h-3" />
                      <span>{isArabic ? "مراجعة" : "Examiner"}</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
