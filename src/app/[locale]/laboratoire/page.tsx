import { getDictionary } from "@/lib/dictionary";

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function LaboratoirePage({ params }: PageProps) {
  const { locale } = await params;
  const dict = getDictionary(locale);

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      <div className="border-b border-sable-200 pb-4">
        <h1 className="text-3xl font-bold text-bleuNuit-900">
          {dict.laboratory.title}
        </h1>
        <p className="text-sable-500 mt-2">
          {dict.laboratory.subtitle}
        </p>
      </div>

      <div className="p-8 rounded-xl border border-dashed border-sable-300 bg-white text-center space-y-4">
        <div className="inline-block p-3 rounded-full bg-sable-100 text-vertProfond-700 font-arabic text-xl font-bold">
          المختبر
        </div>
        <h2 className="text-xl font-semibold text-bleuNuit-900">
          {dict.laboratory.status}
        </h2>
        <p className="text-sm text-sable-500 max-w-md mx-auto">
          {dict.laboratory.statusDesc}
        </p>
      </div>
    </div>
  );
}
