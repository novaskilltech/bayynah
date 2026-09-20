import { getDictionary } from "@/lib/dictionary";

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function BibliothequePage({ params }: PageProps) {
  const { locale } = await params;
  const dict = getDictionary(locale);

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      <div className="border-b border-sable-200 pb-4">
        <h1 className="text-3xl font-bold text-bleuNuit-900">
          {dict.library.title}
        </h1>
        <p className="text-sable-500 mt-2">
          {dict.library.subtitle}
        </p>
      </div>

      <div className="p-8 rounded-xl border border-dashed border-sable-300 bg-white text-center space-y-4">
        <p className="text-sm text-sable-500">
          {dict.library.description}
        </p>
      </div>
    </div>
  );
}
