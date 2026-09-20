"use client";

import React, { useState } from "react";
import { InquiryInput } from "@/lib/schemas/inquiry.schema";
import { EvidenceItem } from "@/types/evidence";
import EvidenceDrawer from "./EvidenceDrawer";
import ConclusionSheetView from "./ConclusionSheetView";
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  FileSearch,
  Sparkles,
  BookOpen,
} from "lucide-react";

interface InquiryEngineProps {
  inquiry: InquiryInput;
  locale: string;
}

export default function InquiryEngine({ inquiry, locale }: InquiryEngineProps) {
  const isArabic = locale === "ar";
  const steps = inquiry.steps;

  // Création d'une map des preuves pour accès rapide
  const evidenceMap = new Map<string, EvidenceItem>();
  for (const ie of inquiry.inquiryEvidences) {
    if (ie.evidence) {
      evidenceMap.set(ie.evidenceId, ie.evidence as EvidenceItem);
    }
  }

  // États du moteur interactif
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [unlockedEvidenceIds, setUnlockedEvidenceIds] = useState<string[]>([]);
  const [isConclusionUnlocked, setIsConclusionUnlocked] = useState(false);
  const [selectedEvidenceForDrawer, setSelectedEvidenceForDrawer] = useState<EvidenceItem | null>(null);

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;

  // Sélection d'une option
  const handleSelectOption = (index: number) => {
    if (isAnswerSubmitted && selectedOptionIndex !== null && currentStep.options[selectedOptionIndex].isCorrect) {
      return; // Déjà validé avec succès
    }
    setSelectedOptionIndex(index);
    setIsAnswerSubmitted(true);

    const option = currentStep.options[index];
    if (option.isCorrect) {
      // Débloquer les preuves de l'étape
      if (currentStep.revealedEvidenceIds.length > 0) {
        setUnlockedEvidenceIds((prev) => {
          const next = new Set([...prev, ...currentStep.revealedEvidenceIds]);
          return Array.from(next);
        });
      }
    }
  };

  // Passer à l'étape suivante ou débloquer la conclusion
  const handleNextStep = () => {
    if (isLastStep) {
      setIsConclusionUnlocked(true);
    } else {
      setCurrentStepIndex((prev) => prev + 1);
      setSelectedOptionIndex(null);
      setIsAnswerSubmitted(false);
    }
  };

  const selectedOption =
    selectedOptionIndex !== null ? currentStep.options[selectedOptionIndex] : null;
  const isCorrect = selectedOption ? selectedOption.isCorrect : false;

  return (
    <div className="max-w-4xl mx-auto space-y-8" dir={isArabic ? "rtl" : "ltr"}>
      {/* 1. Carte de la Prétention Initiale (Claim Card) */}
      <div className="rounded-2xl border border-sable-200 bg-white p-6 sm:p-8 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="px-2.5 py-1 rounded text-xs font-bold bg-sable-100 text-vertProfond-800">
            {inquiry.domain}
          </span>
          <span className="text-xs text-sable-500 font-medium">
            {isArabic ? "قضية للتحقيق والتثبت" : "Cas d'investigation méthodologique"}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-bleuNuit-900 leading-snug">
          {isArabic ? inquiry.title.ar : inquiry.title.fr}
        </h1>

        <div className="p-4 rounded-xl bg-sable-50 border border-sable-200">
          <span className="text-xs font-bold uppercase tracking-wider text-sable-500 block mb-1">
            {isArabic ? "الدعوى المسموعة / المنقولة:" : "Affirmation entendue / rapportée :"}
          </span>
          <p className="text-base sm:text-lg text-bleuNuit-900 font-medium italic">
            « {isArabic ? inquiry.initialClaim.ar : inquiry.initialClaim.fr} »
          </p>
        </div>
      </div>

      {/* 2. Barre de progression par étapes */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-sable-500">
          <span>
            {isArabic ? `الخطوة ${currentStepIndex + 1} من ${steps.length}` : `Étape ${currentStepIndex + 1} sur ${steps.length}`} :{" "}
            <span className="text-bleuNuit-900">
              {isArabic ? currentStep.titleAr || currentStep.titleFr : currentStep.titleFr}
            </span>
          </span>
          <span>{Math.round(((currentStepIndex + 1) / steps.length) * 100)}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-sable-200 overflow-hidden">
          <div
            className="h-full bg-vertProfond-700 transition-all duration-300 rounded-full"
            style={{ width: `${((currentStepIndex + (isCorrect ? 1 : 0.5)) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* 3. Carte d'Étape Active */}
      {!isConclusionUnlocked && (
        <div className="rounded-2xl border border-sable-300 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-vertProfond-50 text-vertProfond-800 border border-vertProfond-100">
              <HelpCircle className="w-3.5 h-3.5" />
              {isArabic ? "سؤال التثبت المنهجي" : "Question de méthode"}
            </span>
            <h2 className="text-xl font-bold text-bleuNuit-900">
              {isArabic ? currentStep.instructionAr || currentStep.instructionFr : currentStep.instructionFr}
            </h2>
          </div>

          {/* Options de réponse */}
          <div className="space-y-3">
            {currentStep.options.map((option, idx) => {
              const isSelected = selectedOptionIndex === idx;
              let btnClass = "border-sable-200 bg-white hover:bg-sable-50 text-bleuNuit-900";

              if (isSelected && isAnswerSubmitted) {
                btnClass = option.isCorrect
                  ? "border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20"
                  : "border-rose-400 bg-rose-50 text-rose-950 ring-2 ring-rose-400/20";
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  className={`w-full p-4 rounded-xl border text-start transition flex items-start gap-3 shadow-xs ${btnClass}`}
                >
                  <span className="w-6 h-6 rounded-full border border-sable-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-sm font-medium leading-relaxed">
                    {isArabic ? option.textAr || option.textFr : option.textFr}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Rétroaction immédiate (Didactic Feedback) */}
          {isAnswerSubmitted && selectedOption && (
            <div
              className={`p-4 rounded-xl border text-sm leading-relaxed space-y-3 ${
                isCorrect
                  ? "bg-emerald-50/80 border-emerald-300 text-emerald-900"
                  : "bg-amber-50/80 border-amber-300 text-amber-900"
              }`}
            >
              <div className="flex items-center gap-2 font-bold">
                {isCorrect ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>{isArabic ? "أحسنت! إجابة منهجية صحيحة" : "Excellente démarche méthodologique !"}</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-amber-600 shrink-0" />
                    <span>{isArabic ? "تنبيه منهجي" : "Attention au piège méthodologique :"}</span>
                  </>
                )}
              </div>

              <p className="ps-7">
                {isArabic
                  ? selectedOption.feedbackAr || selectedOption.feedbackFr
                  : selectedOption.feedbackFr}
              </p>

              {/* Si correct : preuves débloquées lors de cette étape */}
              {isCorrect && currentStep.revealedEvidenceIds.length > 0 && (
                <div className="ps-7 pt-2 border-t border-emerald-200 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    {isArabic ? "دليل تم كشفه:" : "Preuve révélée :"}
                  </span>
                  {currentStep.revealedEvidenceIds.map((evId) => {
                    const ev = evidenceMap.get(evId);
                    if (!ev) return null;
                    return (
                      <button
                        key={evId}
                        onClick={() => setSelectedEvidenceForDrawer(ev)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-white border border-emerald-300 text-emerald-900 hover:bg-emerald-100 transition shadow-xs"
                      >
                        <BookOpen className="w-3 h-3 text-emerald-700" />
                        <span>{ev.referenceCode}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Bouton pour continuer */}
              {isCorrect && (
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleNextStep}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-vertProfond-700 text-white font-semibold hover:bg-vertProfond-800 transition shadow-sm text-sm"
                  >
                    <span>
                      {isLastStep
                        ? isArabic ? "عرض الفيشة الختامية للتحقيق" : "Découvrir la conclusion documentée"
                        : isArabic ? "الخطوة التالية" : "Étape suivante"}
                    </span>
                    {isArabic ? (
                      <ArrowLeft className="w-4 h-4" />
                    ) : (
                      <ArrowRight className="w-4 h-4" />
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. Preuves accumulées pendant l'enquête (Barre latérale ou bandeau) */}
      {unlockedEvidenceIds.length > 0 && !isConclusionUnlocked && (
        <div className="p-4 rounded-xl bg-sable-100/60 border border-sable-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-bleuNuit-900 flex items-center gap-1.5">
              <FileSearch className="w-4 h-4 text-vertProfond-700" />
              {isArabic ? "الأدلة التي جُمعت في هذا التحقيق:" : "Preuves recueillies au cours de l'enquête :"}
            </span>
            <span className="text-xs text-sable-500 font-sans">
              {unlockedEvidenceIds.length} {isArabic ? "دليل" : "document(s)"}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {unlockedEvidenceIds.map((evId) => {
              const ev = evidenceMap.get(evId);
              if (!ev) return null;
              return (
                <button
                  key={evId}
                  onClick={() => setSelectedEvidenceForDrawer(ev)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-sable-300 hover:border-vertProfond-600 text-xs font-semibold text-bleuNuit-900 shadow-xs transition"
                >
                  <BookOpen className="w-3.5 h-3.5 text-vertProfond-600" />
                  <span>{ev.referenceCode}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Rendu de la Fiche de Conclusion Standardisée (Débloquée à la fin) */}
      {isConclusionUnlocked && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-vertProfond-700 text-white flex items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-sable-200 shrink-0" />
              <p className="text-sm font-semibold">
                {isArabic
                  ? "اكتملت مراحل التحقيق المنهجي بنجاح!"
                  : "Félicitations ! Vous avez complété toutes les étapes d'investigation avec succès."}
              </p>
            </div>
            <button
              onClick={() => {
                setIsConclusionUnlocked(false);
                setCurrentStepIndex(0);
                setSelectedOptionIndex(null);
                setIsAnswerSubmitted(false);
              }}
              className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-xs font-semibold transition"
            >
              {isArabic ? "إعادة التحقيق" : "Recommencer"}
            </button>
          </div>

          <ConclusionSheetView
            conclusion={inquiry.conclusionSheet}
            evidenceMap={evidenceMap}
            onSelectEvidence={(ev) => setSelectedEvidenceForDrawer(ev)}
            locale={locale}
          />
        </div>
      )}

      {/* 6. Tiroir modal d'inspection de preuve */}
      <EvidenceDrawer
        evidence={selectedEvidenceForDrawer}
        isOpen={selectedEvidenceForDrawer !== null}
        onClose={() => setSelectedEvidenceForDrawer(null)}
        locale={locale}
      />
    </div>
  );
}
