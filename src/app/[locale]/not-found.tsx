"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export default function NotFound() {
  const params = useParams<{ locale: string }>();
  const locale = params.locale === "ar" ? "ar" : "fr";
  const isArabic = locale === "ar";

  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="max-w-xl text-center space-y-5">
        <span className="text-sm font-bold tracking-widest text-vertProfond-700">404</span>
        <h1 className="text-3xl font-extrabold text-bleuNuit-900">
          {isArabic ? "الصفحة غير موجودة" : "Page introuvable"}
        </h1>
        <p className="text-sm text-sable-500">
          {isArabic
            ? "قد يكون الرابط قديماً أو غير صحيح. ارجع إلى المحتوى المنشور والمتاح."
            : "Le lien est peut-être ancien ou incorrect. Revenez aux contenus publiés et disponibles."}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href={`/${locale}`} className="px-5 py-2.5 rounded-xl bg-vertProfond-700 text-white text-sm font-semibold">
            {isArabic ? "الرئيسية" : "Accueil"}
          </Link>
          <Link href={`/${locale}/ecoles`} className="px-5 py-2.5 rounded-xl border border-sable-300 bg-white text-sm font-semibold">
            {isArabic ? "الدروس" : "Leçons"}
          </Link>
          <Link href={`/${locale}/laboratoire`} className="px-5 py-2.5 rounded-xl border border-sable-300 bg-white text-sm font-semibold">
            {isArabic ? "التحقيقات" : "Enquêtes"}
          </Link>
        </div>
      </div>
    </div>
  );
}
