import { getDictionary } from "@/lib/dictionary";

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function EcolesPage({ params }: PageProps) {
  const { locale } = await params;
  const dict = getDictionary(locale);

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      <div className="border-b border-sable-200 pb-4">
        <h1 className="text-3xl font-bold text-bleuNuit-900">
          {dict.schools.title}
        </h1>
        <p className="text-sable-500 mt-2">
          {dict.schools.subtitle}
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {dict.schools.items.map((ecole) => (
          <div
            key={ecole.id}
            className="p-6 rounded-xl border border-sable-200 bg-white shadow-sm hover:border-vertProfond-600 transition"
          >
            <h2 className="text-xl font-bold font-arabic text-vertProfond-700 mb-1">
              {ecole.titleAr}
            </h2>
            <h3 className="text-base font-semibold text-bleuNuit-900 mb-2">
              {ecole.title}
            </h3>
            <p className="text-sm text-sable-500 leading-relaxed">
              {ecole.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
