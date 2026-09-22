"use client";

import { useParams } from "next/navigation";

export default function ErrorBoundary({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const params = useParams<{ locale: string }>();
  const isArabic = params.locale === "ar";

  return (
    <div className="min-h-[45vh] flex items-center justify-center">
      <div className="max-w-lg rounded-2xl border border-red-200 bg-white p-8 text-center space-y-4 shadow-sm">
        <h1 className="text-xl font-bold text-bleuNuit-900">
          {isArabic ? "تعذر عرض هذه الصفحة" : "Cette page n’a pas pu être affichée"}
        </h1>
        <p className="text-sm text-sable-500">
          {isArabic
            ? "حدث خطأ مؤقت. يمكنك إعادة المحاولة دون فقدان تقدمك المحلي."
            : "Une erreur temporaire est survenue. Vous pouvez réessayer sans perdre votre progression locale."}
        </p>
        <button
          onClick={reset}
          className="px-5 py-2.5 rounded-xl bg-vertProfond-700 text-white text-sm font-semibold hover:bg-vertProfond-800 transition"
        >
          {isArabic ? "إعادة المحاولة" : "Réessayer"}
        </button>
      </div>
    </div>
  );
}
