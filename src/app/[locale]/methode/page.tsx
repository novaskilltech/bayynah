import { getDictionary } from "@/lib/dictionary";

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function MethodePage({ params }: PageProps) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  const isArabic = locale === "ar";

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      <div className="border-b border-sable-200 pb-4">
        <h1 className="text-3xl font-bold text-bleuNuit-900">
          {dict.method.title}
        </h1>
        <p className="text-sable-500 mt-2">
          {dict.method.subtitle}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {dict.method.steps.map((step) => (
          <div
            key={step.num}
            className="p-5 rounded-lg border border-sable-200 bg-white shadow-sm hover:border-vertProfond-600 transition"
          >
            <div className="flex items-center gap-3 text-vertProfond-700 font-bold text-lg mb-2">
              <span className="w-8 h-8 rounded-full bg-sable-100 flex items-center justify-center text-sm font-sans">
                {step.num}
              </span>
              <span className="font-arabic">{isArabic ? step.ar : step.question}</span>
            </div>
            <p className="text-sm text-sable-600 leading-relaxed">
              {step.explanation}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
