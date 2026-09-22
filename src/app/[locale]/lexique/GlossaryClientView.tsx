"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { GlossaryTerm, GlossaryCategory } from "@/lib/glossary-data";
import { VALID_GLOSSARY_TERM_IDS } from "@/lib/telemetry-contract";
import { sendTelemetryEvent } from "@/lib/usePedagogicalTracker";
import { Search, BookOpen, Lightbulb, AlertCircle, Sparkles, Filter } from "lucide-react";

interface GlossaryClientViewProps {
  terms: GlossaryTerm[];
  locale: string;
}

const CATEGORIES: Array<{ id: GlossaryCategory | "all"; labelFr: string; labelAr: string }> = [
  { id: "all", labelFr: "Tous les termes", labelAr: "جميع المصطلحات" },
  { id: "hadith", labelFr: "Sciences du Hadith", labelAr: "علوم الحديث" },
  { id: "usul", labelFr: "Uṣūl al-Fiqh", labelAr: "أصول الفقه" },
  { id: "epistemology", labelFr: "Épistémologie & Logique", labelAr: "نظرية المعرفة والمنطق" },
  { id: "governance", labelFr: "Gouvernance Scientifique", labelAr: "الحوكمة العلمية" },
];

export default function GlossaryClientView({ terms, locale }: GlossaryClientViewProps) {
  const isArabic = locale === "ar";
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<GlossaryCategory | "all">("all");
  const trackedTermsRef = useRef(new Set<string>());

  useEffect(() => {
    const trackHashTerm = () => {
      const termId = decodeURIComponent(window.location.hash.slice(1));
      if (
        !termId ||
        trackedTermsRef.current.has(termId) ||
        !(VALID_GLOSSARY_TERM_IDS as readonly string[]).includes(termId)
      ) {
        return;
      }

      trackedTermsRef.current.add(termId);
      const canonicalTermId = termId as (typeof VALID_GLOSSARY_TERM_IDS)[number];
      sendTelemetryEvent({
        eventType: "GLOSSARY_OPENED",
        resourceType: "glossary",
        resourceId: canonicalTermId,
        metadata: { termId: canonicalTermId },
      });
    };

    trackHashTerm();
    window.addEventListener("hashchange", trackHashTerm);
    return () => window.removeEventListener("hashchange", trackHashTerm);
  }, []);

  const filteredTerms = useMemo(() => {
    return terms.filter((term) => {
      const matchesCategory =
        selectedCategory === "all" || term.category === selectedCategory;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        term.id.includes(q) ||
        term.termFr.toLowerCase().includes(q) ||
        term.termAr.includes(q) ||
        term.shortDefinitionFr.toLowerCase().includes(q) ||
        term.shortDefinitionAr.includes(q) ||
        term.analogyFr.toLowerCase().includes(q) ||
        term.trapFr.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [terms, selectedCategory, searchQuery]);

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6 space-y-8" dir={isArabic ? "rtl" : "ltr"}>
      {/* En-tête de la page */}
      <div className="bg-white p-8 rounded-3xl border border-sable-200 shadow-xs space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-vertProfond-100 text-vertProfond-800 text-xs font-bold">
          <BookOpen className="w-3.5 h-3.5" />
          <span>{isArabic ? "المعجم المنهجي المعتمد" : "Lexique & Référentiel Épistémologique"}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-bleuNuit-900 font-arabic tracking-tight">
          {isArabic ? "معجم المصطلحات الأصولية والنقدية" : "Lexique Méthodologique de TABAYYUN"}
        </h1>

        <p className="text-sable-600 text-sm max-w-2xl leading-relaxed">
          {isArabic
            ? "دليل مبسط ومحكم لمصطلحات النقد، والإسناد، ودلالات الألفاظ، والتحقيق العلمي، لتمكين الباحث والمتعلم من استيعاب المفاهيم دون لبس أو غموض."
            : "Guide concis des termes fondamentaux d'uṣūl al-ḥadīth, d'uṣūl al-fiqh et de falsifiabilité. Chaque concept est explicité en langage clair, illustré par une analogie contemporaine et prémuni contre les pièges fréquents."}
        </p>
      </div>

      {/* Barre de recherche & Filtres */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Recherche */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-sable-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isArabic ? "ابحث عن مصطلح (مثل: دلالة، تخريج، جمع...)" : "Rechercher un terme (ex: dalāla, takhrīj, jam'...)"}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-sable-300 rounded-2xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-vertProfond-600 shadow-xs"
          />
        </div>

        {/* Filtres par catégorie */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
          <Filter className="w-3.5 h-3.5 text-sable-400 shrink-0 hidden sm:block mr-1" />
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
                selectedCategory === cat.id
                  ? "bg-bleuNuit-900 text-white shadow-xs"
                  : "bg-white border border-sable-200 text-sable-600 hover:bg-sable-50"
              }`}
            >
              {isArabic ? cat.labelAr : cat.labelFr}
            </button>
          ))}
        </div>
      </div>

      {/* Grille des termes */}
      {filteredTerms.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-sable-200 space-y-3">
          <Sparkles className="w-8 h-8 text-sable-300 mx-auto" />
          <p className="text-sm font-bold text-bleuNuit-900">
            {isArabic ? "لم يتم العثور على أي مصطلح يطابق بحثك." : "Aucun terme ne correspond à votre recherche."}
          </p>
          <p className="text-xs text-sable-500">
            {isArabic ? "جرب البحث بكلمة مفتاحية أخرى أو إلغاء تصفية الفئات." : "Essayez avec d'autres mots-clés ou réinitialisez les filtres."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTerms.map((term) => (
            <div
              key={term.id}
              id={term.id}
              className="bg-white p-6 rounded-3xl border border-sable-200 shadow-xs hover:shadow-md transition-shadow space-y-4 flex flex-col justify-between scroll-mt-24"
            >
              <div className="space-y-3">
                {/* En-tête de carte */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-bold text-bleuNuit-900 font-arabic">
                      {term.termAr}
                    </h2>
                    <p className="text-xs font-semibold text-sable-600">
                      {term.termFr}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-sable-100 text-sable-700 text-[10px] font-bold uppercase tracking-wider shrink-0">
                    {term.category}
                  </span>
                </div>

                {/* Définition courte */}
                <p className="text-xs text-sable-800 leading-relaxed font-medium">
                  {isArabic ? term.shortDefinitionAr : term.shortDefinitionFr}
                </p>

                {/* Analogie moderne */}
                {(isArabic ? term.analogyAr : term.analogyFr) && (
                  <div className="p-2.5 rounded-xl bg-vertProfond-50/70 border border-vertProfond-100 text-vertProfond-900 flex items-start gap-2 text-[11px] leading-relaxed">
                    <Lightbulb className="w-3.5 h-3.5 text-vertProfond-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold">{isArabic ? "مثال تقريبي:" : "Analogie :"}</strong>{" "}
                      {isArabic ? term.analogyAr : term.analogyFr}
                    </div>
                  </div>
                )}

                {/* Piège fréquent */}
                {(isArabic ? term.trapAr : term.trapFr) && (
                  <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-100 text-amber-900 flex items-start gap-2 text-[11px] leading-relaxed">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold">{isArabic ? "المحذور الشائع:" : "Piège fréquent :"}</strong>{" "}
                      {isArabic ? term.trapAr : term.trapFr}
                    </div>
                  </div>
                )}

                {/* Sources de référence classiques */}
                {term.sources && term.sources.length > 0 && (
                  <div className="pt-2 text-[10px] text-sable-500 font-mono">
                    <span className="font-bold text-sable-700">{isArabic ? "المصادر المعتمدة: " : "Sources : "}</span>
                    <span>{term.sources.join(" • ")}</span>
                  </div>
                )}
              </div>

              {/* Pied de carte avec identifiant */}
              <div className="pt-3 border-t border-sable-100 flex items-center justify-between text-[10px] text-sable-400 font-mono">
                <span>#{term.id}</span>
                <span className="text-vertProfond-700 font-bold font-sans text-[11px]">
                  TABAYYUN • Lexique
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
