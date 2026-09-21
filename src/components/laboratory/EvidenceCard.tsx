"use client";

import React, { useState } from "react";
import { EvidenceItem } from "@/types/evidence";
import { CheckCircle2, AlertCircle, ExternalLink, Quote } from "lucide-react";

interface EvidenceCardProps {
  evidence: EvidenceItem;
  locale: string;
  roleLabel?: string;
  comment?: string;
}

export default function EvidenceCard({ evidence, locale, roleLabel, comment }: EvidenceCardProps) {
  const [showVocalized, setShowVocalized] = useState(true);
  const isArabic = locale === "ar";

  const isVerbatim = evidence.citationStatus === "VERIFIED_VERBATIM";

  return (
    <div className="rounded-xl border border-sable-200 bg-white p-5 shadow-sm space-y-4 text-start">
      {/* En-tête : Référence et badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sable-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded text-xs font-bold bg-sable-100 text-vertProfond-800">
            {evidence.type}
          </span>
          <span className="text-sm font-semibold text-bleuNuit-900">
            {evidence.referenceCode}
          </span>
          {evidence.primarySource && (
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-vertProfond-50 text-vertProfond-700 border border-vertProfond-100">
              {isArabic ? "مصدر أصلي" : "Source Primaire"}
            </span>
          )}
        </div>

        {/* Badge de statut philologique */}
        <div className="flex items-center gap-1.5 text-xs font-medium">
          {isVerbatim ? (
            <span className="inline-flex items-center gap-1 text-vertProfond-700 bg-vertProfond-50 px-2 py-0.5 rounded-full border border-vertProfond-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isArabic ? "نص حرفي محقق" : "Verbatim vérifié"}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-sable-500 bg-sable-50 px-2 py-0.5 rounded-full border border-sable-200">
              <AlertCircle className="w-3.5 h-3.5" />
              {isArabic ? "قيد المراجعة" : "À vérifier"}
            </span>
          )}
        </div>
      </div>

      {/* Rôle contextuel dans l'enquête (si présent) */}
      {(roleLabel || comment) && (
        <div className="p-3 rounded-lg bg-sable-50 border border-sable-200 text-xs text-bleuNuit-800 space-y-1">
          {roleLabel && <span className="font-bold text-vertProfond-800 block">{roleLabel}</span>}
          {comment && <p>{comment}</p>}
        </div>
      )}

      {/* Texte Arabe (Original vs Vocalisé) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-sable-500">
          <span className="font-medium flex items-center gap-1">
            <Quote className="w-3 h-3" />
            {isArabic ? "النص العربي" : "Texte Arabe"}
          </span>
          {evidence.quoteArVocalized && (
            <button
              onClick={() => setShowVocalized(!showVocalized)}
              className="text-[11px] text-vertProfond-700 hover:underline font-arabic"
            >
              {showVocalized
                ? isArabic ? "عرض النص الأصلي بدون تشكيل" : "Voir sans voyelles (brut)"
                : isArabic ? "عرض النص مشكولاً" : "Afficher les voyelles"}
            </button>
          )}
        </div>

        <div
          dir="rtl"
          className="p-4 rounded-lg bg-sable-50/70 border border-sable-200 font-arabic text-lg sm:text-xl leading-relaxed text-bleuNuit-900 text-right selection:bg-vertProfond-100"
        >
          {showVocalized && evidence.quoteArVocalized
            ? evidence.quoteArVocalized
            : evidence.quoteArOriginal}
        </div>
      </div>

      {/* Traduction Française */}
      <div className="space-y-1">
        <span className="text-xs font-medium text-sable-500">
          {isArabic ? "الترجمة الفرنسية" : "Traduction"}
          {evidence.translator && ` (${evidence.translator})`} :
        </span>
        <p className="text-sm text-bleuNuit-800 italic leading-relaxed bg-white p-3 rounded-lg border border-sable-100">
          « {evidence.translationFr} »
        </p>
      </div>

      {/* Localisation physique et métadonnées */}
      <div className="pt-2 border-t border-sable-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-sable-500">
        {evidence.type === "HADITH" && (
          <>
            <div>
              <span className="font-semibold text-bleuNuit-800">
                {isArabic ? "المصنف:" : "Recueil:"}
              </span>{" "}
              {evidence.collection} ({evidence.author})
            </div>
            <div>
              <span className="font-semibold text-bleuNuit-800">
                {isArabic ? "رقم الحديث والنظام:" : "N° Hadith & Système:"}
              </span>{" "}
              {evidence.hadithNumber} ({evidence.numberingSystem})
            </div>
            <div>
              <span className="font-semibold text-bleuNuit-800">
                {isArabic ? "الحكم العلمي:" : "Degré:"}
              </span>{" "}
              <span className="font-bold text-vertProfond-700">{evidence.authenticityGrade}</span> (
              {evidence.gradeScholar})
            </div>
            <div>
              <span className="font-semibold text-bleuNuit-800">
                {isArabic ? "الموضع والطبعة:" : "Localisation:"}
              </span>{" "}
              {evidence.editionVolumePage}
            </div>
          </>
        )}

        {evidence.type === "BOOK" && (
          <>
            <div>
              <span className="font-semibold text-bleuNuit-800">
                {isArabic ? "الكتاب والمؤلف:" : "Ouvrage & Auteur:"}
              </span>{" "}
              {evidence.sourceWork} ({evidence.author})
            </div>
            <div>
              <span className="font-semibold text-bleuNuit-800">
                {isArabic ? "الجزء والصفحة:" : "Volume / Page:"}
              </span>{" "}
              {evidence.editionVolumePage}
            </div>
          </>
        )}

        {evidence.type === "QURAN" && (
          <>
            <div>
              <span className="font-semibold text-bleuNuit-800">
                {isArabic ? "السورة:" : "Sourate:"}
              </span>{" "}
              {evidence.surahNameAr} ({evidence.surahNameFr}) - n°{evidence.surahNumber}
            </div>
            <div>
              <span className="font-semibold text-bleuNuit-800">
                {isArabic ? "الآية:" : "Verset:"}
              </span>{" "}
              {evidence.ayahNumber}
            </div>
          </>
        )}

        {/* Traçabilité institutionnelle */}
        {evidence.verifiedAt && (
          <div className="col-span-full pt-1 text-[11px] text-sable-400">
            {isArabic ? "مراجعة تحريرية مسجلة بتاريخ " : "Vérification éditoriale enregistrée le "}
            {evidence.verifiedAt}
          </div>
        )}

        {/* Lien de consultation */}
        {evidence.consultationUrl && (
          <div className="col-span-full pt-1">
            <a
              href={evidence.consultationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-vertProfond-700 hover:text-vertProfond-900 transition font-medium"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {isArabic ? "الاطلاع على المصدر في المرجع المتاح" : "Consulter l'édition de référence en ligne"}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
