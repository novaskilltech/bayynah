import fs from "fs";
import path from "path";
import { DiagnosticQuestion } from "@/types/skills";
import DiagnosticRunner from "@/components/skills/DiagnosticRunner";

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function DiagnosticPage({ params }: PageProps) {
  const { locale } = await params;
  const isArabic = locale === "ar";

  const filePath = path.join(process.cwd(), "content", "diagnostic", "questions.json");
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const questions: DiagnosticQuestion[] = JSON.parse(fileContent);

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8" dir={isArabic ? "rtl" : "ltr"}>
      {/* En-tête */}
      <div className="border-b border-sable-200 pb-6 space-y-2 text-start">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-vertProfond-600" />
          <span className="text-xs font-bold uppercase tracking-widest text-sable-500 font-sans">
            {isArabic ? "التقييم المنهجي الأولي" : "Évaluation Initiale"}
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-bleuNuit-900 tracking-tight">
          {isArabic ? "التشخيص المنهجي الأولي" : "Diagnostic Méthodologique Initial"}
        </h1>
        <p className="text-base text-sable-600 max-w-2xl leading-relaxed">
          {isArabic
            ? "14 مسألة عملية لاختبار ردود أفعالك النقدية دون اشتراط حفظ مسبق، لتحديد الكفاءات المتقنة والمواطن التي ينبغي التركيز عليها."
            : "14 situations concrètes pour évaluer vos réflexes critiques sans mémorisation requise, et calibrer votre apprentissage."}
        </p>
      </div>

      {/* Exécuteur de diagnostic */}
      <DiagnosticRunner questions={questions} locale={locale} />
    </div>
  );
}
