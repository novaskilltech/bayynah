import Image from "next/image";
import { getDictionary } from "@/lib/dictionary";

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  const isArabic = locale === "ar";

  return (
    <div className="space-y-20 py-6 sm:py-10">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-white via-ivoire to-sable-50 border border-sable-200/80 p-6 sm:p-12 lg:p-16 shadow-sm">
        {/* Subtle decorative background arabesque glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-vertProfond-100/40 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-sable-300/30 blur-2xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center space-y-8">
          {/* Top Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-vertProfond-50 border border-vertProfond-600/20 text-vertProfond-800 text-xs sm:text-sm font-medium shadow-xs">
            <span className="w-2 h-2 rounded-full bg-vertProfond-700 animate-pulse" />
            <span>{dict.home.badge}</span>
          </div>

          {/* Logo & Headline */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Image
                src="/brand/tabayyun-logo-v1.png"
                alt="TABAYYUN"
                width={80}
                height={80}
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-sm"
                priority
              />
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-bleuNuit-900 tracking-tight leading-tight">
              {dict.home.title}
            </h1>
            <p className="text-base sm:text-xl text-bleuNuit-800/80 max-w-2xl mx-auto font-normal leading-relaxed">
              {dict.home.subtitle}
            </p>
          </div>

          {/* Dual Primary Call-to-Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <a
              href={`/${locale}/diagnostic`}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-vertProfond-700 hover:bg-vertProfond-800 text-white font-semibold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 group text-base"
            >
              <span>{dict.home.ctaTest}</span>
              <span className={`transition-transform ${isArabic ? "group-hover:-translate-x-1" : "group-hover:translate-x-1"}`}>
                {isArabic ? "←" : "→"}
              </span>
            </a>
            <a
              href={`/${locale}/laboratoire`}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-bleuNuit-900 hover:bg-bleuNuit-950 text-white font-semibold shadow-sm hover:shadow transition text-base"
            >
              {dict.home.ctaLab}
            </a>
            <a
              href={`/${locale}/methode`}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white hover:bg-sable-50 border border-sable-300 text-bleuNuit-900 font-semibold shadow-xs transition text-base"
            >
              {dict.home.ctaMethod}
            </a>
          </div>

          {/* Fundamental Chain Pipeline */}
          <div className="pt-6">
            <div className="p-5 sm:p-7 rounded-2xl bg-white/90 border border-sable-200 shadow-sm backdrop-blur">
              <div className="text-xs uppercase tracking-wider text-sable-500 font-semibold mb-3">
                {dict.home.fundamentalChainTitle}
              </div>
              <div className="font-arabic font-bold text-lg sm:text-2xl text-vertProfond-800 mb-2 leading-relaxed">
                الدليل ← صحة النقل ← صحة الفهم ← صحة الاستدلال ← الحكم
              </div>
              <p className="text-xs sm:text-sm text-bleuNuit-800/70 max-w-2xl mx-auto">
                {dict.home.fundamentalChain}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5-STEP METHODOLOGICAL DETAILED PIPELINE */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-bleuNuit-900">
            {isArabic ? "خطوات التثبت المنهجي الخمس" : "Les 5 étapes de la démarche critique"}
          </h2>
          <p className="text-sm sm:text-base text-bleuNuit-800/70">
            {isArabic
              ? "مسار استدلالي محكم يمنع الجزم المتسرع والخلط بين الرأي والنص"
              : "Un enchaînement rigoureux pour éviter l'affirmation hâtive et la confusion des niveaux de discours."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {dict.home.steps.map((item, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white border border-sable-200/90 hover:border-sable-400 hover:shadow-md transition flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="inline-block px-2.5 py-0.5 rounded-md bg-sable-100 text-vertProfond-800 font-mono text-xs font-bold">
                  {item.step}
                </div>
                <h3 className="font-bold text-bleuNuit-900 text-base leading-snug">
                  {item.title}
                </h3>
              </div>
              <p className="text-xs text-bleuNuit-800/70 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 3 CORE PILLARS SECTION */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-bleuNuit-900">
            {dict.home.pillarsTitle}
          </h2>
          <p className="text-sm sm:text-base text-bleuNuit-800/70">
            {dict.home.pillarsSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {dict.home.pillars.map((pillar, idx) => (
            <div
              key={idx}
              className="p-6 sm:p-8 rounded-2xl bg-white border border-sable-200 hover:border-vertProfond-700/40 hover:shadow-lg transition flex flex-col justify-between space-y-6"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-vertProfond-50 border border-vertProfond-600/20 text-vertProfond-800 flex items-center justify-center font-bold text-base">
                  0{idx + 1}
                </div>
                <h3 className="text-xl font-bold text-bleuNuit-900">
                  {pillar.title}
                </h3>
                <p className="text-sm text-bleuNuit-800/75 leading-relaxed">
                  {pillar.desc}
                </p>
              </div>

              <div>
                <a
                  href={`/${locale}${pillar.href}`}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-vertProfond-700 hover:text-vertProfond-900 transition"
                >
                  <span>{pillar.linkText}</span>
                  <span>{isArabic ? "←" : "→"}</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* METHODOLOGY CLASSICAL ANCHOR QUOTE */}
      <section className="rounded-2xl bg-gradient-to-r from-vertProfond-900 via-vertProfond-800 to-vertProfond-900 text-white p-8 sm:p-12 text-center space-y-4 shadow-sm">
        <div className="max-w-3xl mx-auto space-y-4">
          <p className="font-arabic text-2xl sm:text-3xl font-bold text-sable-200 leading-relaxed">
            {dict.home.methodologyQuote.quote}
          </p>
          <p className="text-base sm:text-lg text-ivoire/90 italic font-serif">
            {dict.home.methodologyQuote.translation}
          </p>
          <p className="text-xs tracking-wider text-sable-400 font-sans uppercase">
            — {dict.home.methodologyQuote.author}
          </p>
        </div>
      </section>

      {/* FINAL CALL TO ACTION BANNER */}
      <section className="rounded-3xl bg-sable-100/80 border border-sable-200 p-8 sm:p-12 text-center space-y-6">
        <div className="max-w-xl mx-auto space-y-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-bleuNuit-900">
            {dict.home.bannerTitle}
          </h2>
          <p className="text-sm sm:text-base text-bleuNuit-800/80">
            {dict.home.bannerDesc}
          </p>
        </div>
        <div className="pt-2">
          <a
            href={`/${locale}/diagnostic`}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-vertProfond-700 hover:bg-vertProfond-800 text-white font-bold shadow-md hover:shadow-lg transition text-base"
          >
            <span>{dict.home.bannerCta}</span>
            <span>{isArabic ? "←" : "→"}</span>
          </a>
        </div>
      </section>
    </div>
  );
}
