import fs from "fs";
import path from "path";
import { FinalAssessmentScenario } from "@/types/skills";
import FinalAssessmentRunner from "@/components/skills/FinalAssessmentRunner";

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function EvaluationFinalePage({ params }: PageProps) {
  const { locale } = await params;
  const isArabic = locale === "ar";

  const filePath = path.join(process.cwd(), "content", "assessment", "scenarios.json");
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const scenarios: FinalAssessmentScenario[] = JSON.parse(fileContent);

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8" dir={isArabic ? "rtl" : "ltr"}>
      {/* En-tête */}
      <div className="border-b border-sable-200 pb-6 space-y-2 text-start">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-vertProfond-600" />
          <span className="text-xs font-bold uppercase tracking-widest text-sable-500 font-sans">
            {isArabic ? "التقويم الختامي والتحويل" : "Évaluation Finale de Transfert"}
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-bleuNuit-900 tracking-tight">
          {isArabic ? "التقويم الختامي وإفادة التمكن" : "Évaluation Finale & Attestation"}
        </h1>
        <p className="text-base text-sable-600 max-w-2xl leading-relaxed">
          {isArabic
            ? "8 سيناريوهات تطبيقية غير مسبوقة لقياس قدرتك على نقل القواعد النقدية والأصولية إلى نوازل وقضايا معاصرة شائكة."
            : "8 micro-scénarios inédits pour évaluer votre capacité à transférer les réflexes critiques vers des cas contemporains complexes."}
        </p>
      </div>

      <FinalAssessmentRunner scenarios={scenarios} locale={locale} />
    </div>
  );
}
