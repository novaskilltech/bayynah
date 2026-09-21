"use client";

import React, { useState } from "react";
import { CheckCircle2, Quote, BookOpen } from "lucide-react";

interface HistoricReferenceProps {
  reference: {
    author: string;
    work: string;
    editionVolumePage: string;
    quoteArOriginal: string;
    quoteArVocalized?: string;
    quoteArNormalized?: string;
    translationFr: string;
    translator?: string;
    citationStatus?: string;
    verifiedAt?: string;
    verifiedBy?: string;
  };
  locale: string;
}

export default function HistoricReferenceCard({ reference, locale }: HistoricReferenceProps) {
  const [viewMode, setViewMode] = useState<"vocalized" | "original">("vocalized");
  const isArabic = locale === "ar";

  const displayedArabic =
    viewMode === "vocalized" && reference.quoteArVocalized
      ? reference.quoteArVocalized
      : reference.quoteArOriginal;

  return (
    <div className="rounded-xl border border-sable-200 bg-ivoire-50 overflow-hidden shadow-sm my-6">
      {/* En-tête de la référence */}
      <div className="bg-sable-100/60 px-5 py-3 border-b border-sable-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-vertProfond-700" />
          <span className="text-xs font-bold uppercase tracking-wider text-bleuNuit-900">
            {isArabic ? "النص المرجعي الأصلي المُوثّق" : "Référence historique vérifiée"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {reference.quoteArVocalized && (
            <button
              onClick={() => setViewMode(viewMode === "vocalized" ? "original" : "vocalized")}
              className="text-xs px-2.5 py-1 rounded bg-white border border-sable-300 text-bleuNuit-800 hover:bg-sable-50 transition"
              title={isArabic ? "تبديل التشكيل" : "Basculer la vocalisation"}
            >
              {viewMode === "vocalized"
                ? isArabic
                  ? "إخفاء التشكيل"
                  : "Sans voyelles"
                : isArabic
                ? "إظهار التشكيل"
                : "Vocalisé"}
            </button>
          )}

          {reference.citationStatus === "VERIFIED_VERBATIM" && (
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isArabic ? "موثق بالنص" : "Vérifié Verbatim"}</span>
            </span>
          )}
        </div>
      </div>

      {/* Corps : Citation arabe et traduction */}
      <div className="p-5 space-y-4">
        <div className="relative pl-6 rtl:pl-0 rtl:pr-6 border-l-4 rtl:border-l-0 rtl:border-r-4 border-vertProfond-600">
          <Quote className="absolute top-0 left-0 rtl:left-auto rtl:right-0 w-4 h-4 text-vertProfond-400 opacity-60" />
          <p
            dir="rtl"
            className="text-xl font-arabic leading-loose text-bleuNuit-950 font-normal select-text"
          >
            {displayedArabic}
          </p>
        </div>

        <div className="text-sm text-sable-700 leading-relaxed italic border-t border-sable-200/60 pt-3">
          <span className="font-semibold not-italic text-bleuNuit-900 mr-2 rtl:mr-0 rtl:ml-2">
            {isArabic ? "الترجمة:" : "Traduction :"}
          </span>
          « {reference.translationFr} »
        </div>

        {/* Métadonnées de l'ouvrage */}
        <div className="bg-white/80 rounded-lg p-3 border border-sable-200/80 text-xs text-sable-600 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <span className="font-semibold text-bleuNuit-800">
              {isArabic ? "القائل / المؤلف:" : "Auteur :"}
            </span>{" "}
            {reference.author}
          </div>
          <div>
            <span className="font-semibold text-bleuNuit-800">
              {isArabic ? "المصدر:" : "Ouvrage :"}
            </span>{" "}
            {reference.work}
          </div>
          <div className="sm:col-span-2">
            <span className="font-semibold text-bleuNuit-800">
              {isArabic ? "الموضع والتحقيق:" : "Édition / Localisation :"}
            </span>{" "}
            {reference.editionVolumePage}
          </div>
        </div>
      </div>
    </div>
  );
}
