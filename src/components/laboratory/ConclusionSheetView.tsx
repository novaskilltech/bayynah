"use client";

import React from "react";
import { StandardConclusionSheet } from "@/types/inquiry";
import { EvidenceItem } from "@/types/evidence";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  BookOpen,
  Users,
  Scale,
  Brain,
  Library,
  Target,
  FileText,
} from "lucide-react";

interface ConclusionSheetViewProps {
  conclusion: StandardConclusionSheet;
  evidenceMap: Map<string, EvidenceItem>;
  onSelectEvidence: (evidence: EvidenceItem) => void;
  locale: string;
}

export default function ConclusionSheetView({
  conclusion,
  evidenceMap,
  onSelectEvidence,
  locale,
}: ConclusionSheetViewProps) {
  const isArabic = locale === "ar";

  // Rendu des badges cliquables de preuves rattachées
  const renderEvidenceBadges = (evidenceIds?: string[]) => {
    if (!evidenceIds || evidenceIds.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-sable-100">
        <span className="text-[11px] font-semibold text-sable-500 self-center me-1">
          {isArabic ? "الأدلة الموثقة:" : "Preuves rattachées :"}
        </span>
        {evidenceIds.map((id) => {
          const ev = evidenceMap.get(id);
          const label = ev ? ev.referenceCode : id;
          return (
            <button
              key={id}
              onClick={() => ev && onSelectEvidence(ev)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-white border border-sable-300 hover:border-vertProfond-600 hover:bg-vertProfond-50 text-vertProfond-800 transition shadow-xs"
              title={isArabic ? "عرض بطاقة الدليل" : "Inspecter la fiche de preuve"}
            >
              <FileText className="w-3 h-3 text-vertProfond-600" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    );
  };

  // Badge du niveau de certitude
  const renderCertaintyBadge = (level: string) => {
    const config: Record<
      string,
      { labelFr: string; labelAr: string; colorClass: string; iconColor: string }
    > = {
      ETABLI: {
        labelFr: "Établi",
        labelAr: "ثابت ومقرر",
        colorClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
        iconColor: "text-emerald-600",
      },
      FORTEMENT_ETABLI: {
        labelFr: "Fortement établi",
        labelAr: "راجح بقوة",
        colorClass: "bg-blue-50 text-blue-800 border-blue-200",
        iconColor: "text-blue-600",
      },
      KHILAF_RECONNU: {
        labelFr: "Divergence reconnue (Khilâf)",
        labelAr: "خلاف معتبر سائغ",
        colorClass: "bg-amber-50 text-amber-800 border-amber-200",
        iconColor: "text-amber-600",
      },
      EXPERTISE_REQUISE: {
        labelFr: "Question nécessitant une expertise",
        labelAr: "مسألة تفتقر إلى نظر مجتهد",
        colorClass: "bg-orange-50 text-orange-800 border-orange-200",
        iconColor: "text-orange-600",
      },
      INSUFFISANT: {
        labelFr: "Informations insuffisantes (لا أدري)",
        labelAr: "المعطيات غير كافية للجزم (لا أدري)",
        colorClass: "bg-zinc-50 text-zinc-800 border-zinc-200",
        iconColor: "text-zinc-600",
      },
    };

    const c = config[level] || config.INSUFFISANT;

    return (
      <div
        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-sm font-bold shadow-xs ${c.colorClass}`}
      >
        <Target className={`w-4 h-4 ${c.iconColor}`} />
        <span>{isArabic ? c.labelAr : c.labelFr}</span>
      </div>
    );
  };

  return (
    <div className="rounded-2xl border-2 border-vertProfond-700/20 bg-white p-6 sm:p-8 shadow-md space-y-6 text-start">
      {/* En-tête de la fiche */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sable-200 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-sable-500 block">
            {isArabic ? "وثيقة التحقيق المنهجي" : "Fiche de Conclusion Standardisée"}
          </span>
          <h2 className="text-2xl font-extrabold text-bleuNuit-900 mt-1">
            {isArabic ? "خلاصة التحقيق والتثبت" : "Résultat de l'Enquête Méthodologique"}
          </h2>
        </div>
        <div>{renderCertaintyBadge(conclusion.certaintyLevel)}</div>
      </div>

      {/* Grille des 9 rubriques */}
      <div className="space-y-4">
        {/* 1. ✅ Ce qui est établi */}
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-1">
          <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>{isArabic ? "✅ ما هو ثابت ومقرر" : "✅ Ce qui est établi"}</span>
          </div>
          <p className="text-sm text-bleuNuit-900 leading-relaxed ps-6 font-medium">
            {isArabic ? conclusion.established.ar : conclusion.established.fr}
          </p>
          <div className="ps-6">{renderEvidenceBadges(conclusion.established.evidenceIds)}</div>
        </div>

        {/* 2. ⚠️ Ce qui est discuté */}
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-1">
          <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-700" />
            <span>{isArabic ? "⚠️ ما هو محل بحث وخلاف" : "⚠️ Ce qui est discuté"}</span>
          </div>
          <p className="text-sm text-bleuNuit-900 leading-relaxed ps-6">
            {isArabic ? conclusion.discussed.ar : conclusion.discussed.fr}
          </p>
          <div className="ps-6">{renderEvidenceBadges(conclusion.discussed.evidenceIds)}</div>
        </div>

        {/* 3. ❌ Ce qui n'est pas établi */}
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 space-y-1">
          <div className="flex items-center gap-2 font-bold text-rose-900 text-sm">
            <XCircle className="w-4 h-4 text-rose-700" />
            <span>{isArabic ? "❌ ما لم يثبت ولا أصل له" : "❌ Ce qui n'est pas établi"}</span>
          </div>
          <p className="text-sm text-bleuNuit-900 leading-relaxed ps-6">
            {isArabic ? conclusion.notEstablished.ar : conclusion.notEstablished.fr}
          </p>
          <div className="ps-6">{renderEvidenceBadges(conclusion.notEstablished.evidenceIds)}</div>
        </div>

        {/* 4. 📜 Preuves principales */}
        <div className="p-4 rounded-xl border border-sable-200 bg-sable-50/50 space-y-2">
          <div className="flex items-center gap-2 font-bold text-bleuNuit-900 text-sm">
            <BookOpen className="w-4 h-4 text-vertProfond-700" />
            <span>{isArabic ? "📜 عمدة الأدلة في الباب" : "📜 Preuves principales"}</span>
          </div>
          <ul className="list-disc list-inside text-sm text-bleuNuit-800 ps-6 space-y-1">
            {conclusion.primaryEvidences.map((pe, idx) => (
              <li key={idx}>{pe}</li>
            ))}
          </ul>
        </div>

        {/* 5. 👥 Compréhension des salaf */}
        <div className="p-4 rounded-xl border border-sable-200 bg-white space-y-1">
          <div className="flex items-center gap-2 font-bold text-bleuNuit-900 text-sm">
            <Users className="w-4 h-4 text-vertProfond-700" />
            <span>{isArabic ? "👥 فهم السلف الصالح" : "👥 Compréhension des Salaf"}</span>
          </div>
          <p className="text-sm text-bleuNuit-800 leading-relaxed ps-6">
            {isArabic ? conclusion.salafUnderstanding.ar : conclusion.salafUnderstanding.fr}
          </p>
          <div className="ps-6">{renderEvidenceBadges(conclusion.salafUnderstanding.evidenceIds)}</div>
        </div>

        {/* 6. ⚖️ Positions des savants */}
        <div className="p-4 rounded-xl border border-sable-200 bg-white space-y-1">
          <div className="flex items-center gap-2 font-bold text-bleuNuit-900 text-sm">
            <Scale className="w-4 h-4 text-vertProfond-700" />
            <span>{isArabic ? "⚖️ مذاهب الفقهاء وأقوالهم" : "⚖️ Positions des savants"}</span>
          </div>
          <p className="text-sm text-bleuNuit-800 leading-relaxed ps-6">
            {isArabic ? conclusion.scholarlyPositions.ar : conclusion.scholarlyPositions.fr}
          </p>
          <div className="ps-6">{renderEvidenceBadges(conclusion.scholarlyPositions.evidenceIds)}</div>
        </div>

        {/* 7. 🧠 Erreur méthodologique fréquente */}
        <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 space-y-1">
          <div className="flex items-center gap-2 font-bold text-purple-900 text-sm">
            <Brain className="w-4 h-4 text-purple-700" />
            <span>{isArabic ? "🧠 المطب المنهجي الشائع" : "🧠 Erreur méthodologique fréquente"}</span>
          </div>
          <p className="text-sm text-bleuNuit-900 leading-relaxed ps-6">
            {isArabic ? conclusion.methodologicalPitfall.ar : conclusion.methodologicalPitfall.fr}
          </p>
          <div className="ps-6">{renderEvidenceBadges(conclusion.methodologicalPitfall.evidenceIds)}</div>
        </div>

        {/* 8. 📚 Sources originales */}
        <div className="p-4 rounded-xl border border-sable-200 bg-sable-50/50 space-y-2">
          <div className="flex items-center gap-2 font-bold text-bleuNuit-900 text-sm">
            <Library className="w-4 h-4 text-vertProfond-700" />
            <span>{isArabic ? "📚 المصادر والمراجع المعتمدة" : "📚 Sources originales"}</span>
          </div>
          <div className="flex flex-wrap gap-2 ps-6">
            {conclusion.originalSources.map((src, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded bg-white border border-sable-300 text-xs font-medium text-bleuNuit-800 shadow-xs"
              >
                {src}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
