"use client";

import React, { useState, useMemo } from "react";
import { InquiryInput } from "@/lib/schemas/inquiry.schema";
import {
  StepOptionQuality,
  MethodologicalScore,
  RevealPolicy,
} from "@/types/inquiry";
import { EvidenceItem } from "@/types/evidence";
import EvidenceDrawer from "./EvidenceDrawer";
import ConclusionSheetView from "./ConclusionSheetView";
import { usePedagogicalTracker } from "@/lib/usePedagogicalTracker";
import type { InquiryId } from "@/lib/telemetry-contract";
import {
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  FileSearch,
  Sparkles,
  BookOpen,
  RotateCcw,
  Award,
  ShieldCheck,
  Scale,
  Brain,
} from "lucide-react";

interface InquiryEngineProps {
  inquiry: InquiryInput & { id: InquiryId };
  locale: string;
}

interface AttemptRecord {
  stepNumber: number;
  optionIndex: number;
  quality: StepOptionQuality;
  score: MethodologicalScore;
  timestamp: string;
}

export default function InquiryEngine({ inquiry, locale }: InquiryEngineProps) {
  const isArabic = locale === "ar";
  const steps = inquiry.steps;
  const storageKey = `tabayyun_attempts_${inquiry.id}`;

  // Map des preuves pour accès rapide
  const evidenceMap = useMemo(() => {
    const map = new Map<string, EvidenceItem>();
    for (const ie of inquiry.inquiryEvidences) {
      if (ie.evidence) {
        map.set(ie.evidenceId, ie.evidence as EvidenceItem);
      }
    }
    return map;
  }, [inquiry.inquiryEvidences]);

  // États du moteur interactif avec initialisation paresseuse (sans effet de bord synchrone)
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [unlockedEvidenceIds, setUnlockedEvidenceIds] = useState<string[]>(() => {
    const initialStep = steps[0];
    if (initialStep && initialStep.revealPolicy === "ON_STEP_ENTER" && initialStep.revealedEvidenceIds.length > 0) {
      return [...initialStep.revealedEvidenceIds];
    }
    return [];
  });
  const [isConclusionUnlocked, setIsConclusionUnlocked] = useState(false);
  const [selectedEvidenceForDrawer, setSelectedEvidenceForDrawer] = useState<EvidenceItem | null>(null);
  const [attempts, setAttempts] = useState<AttemptRecord[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // Ignore
    }
    return [];
  });

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;

  // Initialisation du tracker de télémétrie pédagogique pour l'enquête
  const { trackInquiryStep, trackInquiryComplete } = usePedagogicalTracker({
    resourceType: "inquiry",
    resourceId: inquiry.id,
    autoTrackOpen: true,
  });

  // Sélection et validation d'une option
  const handleSelectOption = (index: number) => {
    const option = currentStep.options[index];
    setSelectedOptionIndex(index);
    setIsAnswerSubmitted(true);

    // Enregistrement de la tentative
    const newAttempt: AttemptRecord = {
      stepNumber: currentStep.stepNumber,
      optionIndex: index,
      quality: option.quality,
      score: option.methodologicalScore,
      timestamp: new Date().toISOString(),
    };

    const updatedAttempts = [...attempts, newAttempt];
    setAttempts(updatedAttempts);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updatedAttempts));
    } catch {
      // Ignorer si indisponible
    }

    // Télémétrie : mesure de la réponse à l'étape
    const attemptsForThisStep = attempts.filter((a) => a.stepNumber === currentStep.stepNumber);
    trackInquiryStep(currentStep.stepNumber, {
      quality: option.quality,
      methodologicalScore: option.methodologicalScore,
      attemptNumber: attemptsForThisStep.length + 1,
    });

    // Gestion de la politique de déblocage des preuves
    const policy: RevealPolicy = (currentStep.revealPolicy as RevealPolicy) || "AFTER_ANSWER";
    if (policy === "AFTER_ANSWER") {
      if (currentStep.revealedEvidenceIds.length > 0) {
        setUnlockedEvidenceIds((prev) => {
          const next = new Set([...prev, ...currentStep.revealedEvidenceIds]);
          return Array.from(next);
        });
      }
    } else if (policy === "AFTER_BEST_ANSWER") {
      if (option.quality === "BEST" && currentStep.revealedEvidenceIds.length > 0) {
        setUnlockedEvidenceIds((prev) => {
          const next = new Set([...prev, ...currentStep.revealedEvidenceIds]);
          return Array.from(next);
        });
      }
    }
  };

  // Passer à l'étape suivante ou débloquer la conclusion
  const handleNextStep = () => {
    // Si la politique est NEXT_STEP, débloquer les preuves maintenant
    const policy: RevealPolicy = (currentStep.revealPolicy as RevealPolicy) || "AFTER_ANSWER";
    if (policy === "NEXT_STEP" && currentStep.revealedEvidenceIds.length > 0) {
      setUnlockedEvidenceIds((prev) => {
        const next = new Set([...prev, ...currentStep.revealedEvidenceIds]);
        return Array.from(next);
      });
    }

    if (isLastStep) {
      setIsConclusionUnlocked(true);

      // Télémétrie : complétion d'enquête
      const totalPoints = attempts.reduce((acc, att) => acc + att.score, 0);
      const lastOpt = selectedOption || currentStep.options[0];
      trackInquiryComplete({
        finalQuality: lastOpt.quality,
        totalMethodologicalScore: totalPoints,
        stepsCount: steps.length,
      });
    } else {
      const nextIndex = currentStepIndex + 1;
      const nextStep = steps[nextIndex];
      if (nextStep && nextStep.revealPolicy === "ON_STEP_ENTER" && nextStep.revealedEvidenceIds.length > 0) {
        setUnlockedEvidenceIds((prev) => Array.from(new Set([...prev, ...nextStep.revealedEvidenceIds])));
      }
      setCurrentStepIndex(nextIndex);
      setSelectedOptionIndex(null);
      setIsAnswerSubmitted(false);
    }
  };

  // Réinitialiser l'enquête
  const handleReset = () => {
    setIsConclusionUnlocked(false);
    setCurrentStepIndex(0);
    setSelectedOptionIndex(null);
    setIsAnswerSubmitted(false);
    setUnlockedEvidenceIds([]);
    setAttempts([]);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Ignore
    }
  };

  const selectedOption =
    selectedOptionIndex !== null ? currentStep.options[selectedOptionIndex] : null;

  // Calcul du profil méthodologique sur 3 dimensions à la fin
  const profileAnalysis = useMemo(() => {
    if (!isConclusionUnlocked) return null;

    // Regrouper la première tentative pour chaque étape
    const firstAttemptByStep = new Map<number, AttemptRecord>();
    for (const att of attempts) {
      if (!firstAttemptByStep.has(att.stepNumber)) {
        firstAttemptByStep.set(att.stepNumber, att);
      }
    }

    const calcDimensionScore = (stepNumbers: number[]): number => {
      let total = 0;
      let count = 0;
      for (const sn of stepNumbers) {
        const att = firstAttemptByStep.get(sn);
        if (att) {
          total += att.score;
          count++;
        }
      }
      return count > 0 ? total / count : 3;
    };

    // Dimension 1 : Qualité de la vérification (Étapes 2, 3, 4, 7)
    const verificationScore = calcDimensionScore([2, 3, 4, 7]);
    // Dimension 2 : Prudence épistémique (Étapes 1, 5, 6, 9)
    const prudenceScore = calcDimensionScore([1, 5, 6, 9]);
    // Dimension 3 : Qualité de la conclusion (Étapes 8, 10)
    const conclusionScore = calcDimensionScore([8, 10]);

    const getLevel = (score: number) => {
      if (score >= 2.5) {
        return {
          labelFr: "Excellente",
          labelAr: "ممتازة ومحررة",
          colorClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
        };
      }
      if (score >= 1.7) {
        return {
          labelFr: "Solide",
          labelAr: "صلبة ومنضبطة",
          colorClass: "bg-blue-50 text-blue-800 border-blue-200",
        };
      }
      return {
        labelFr: "À renforcer",
        labelAr: "تحتاج إلى مزيد من التثبت",
        colorClass: "bg-amber-50 text-amber-800 border-amber-200",
      };
    };

    const selfCorrectionsCount = attempts.length - firstAttemptByStep.size;

    return {
      verification: { score: verificationScore, ...getLevel(verificationScore) },
      prudence: { score: prudenceScore, ...getLevel(prudenceScore) },
      conclusion: { score: conclusionScore, ...getLevel(conclusionScore) },
      totalAttempts: attempts.length,
      selfCorrectionsCount: Math.max(0, selfCorrectionsCount),
    };
  }, [isConclusionUnlocked, attempts]);

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
            {isArabic
              ? `الخطوة ${currentStepIndex + 1} من ${steps.length}`
              : `Étape ${currentStepIndex + 1} sur ${steps.length}`}{" "}
            :{" "}
            <span className="text-bleuNuit-900">
              {isArabic ? currentStep.titleAr || currentStep.titleFr : currentStep.titleFr}
            </span>
          </span>
          <span className="font-sans font-bold">
            {Math.round(((currentStepIndex + (isAnswerSubmitted ? 1 : 0)) / steps.length) * 100)}%
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-sable-200 overflow-hidden">
          <div
            className="h-full bg-vertProfond-700 transition-all duration-300 rounded-full"
            style={{
              width: `${((currentStepIndex + (isAnswerSubmitted ? 1 : 0.4)) / steps.length) * 100}%`,
            }}
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
              {isArabic
                ? currentStep.instructionAr || currentStep.instructionFr
                : currentStep.instructionFr}
            </h2>
          </div>

          {/* Options de réponse */}
          <div className="space-y-3">
            {currentStep.options.map((option, idx) => {
              const isSelected = selectedOptionIndex === idx;
              let btnClass = "border-sable-200 bg-white hover:bg-sable-50 text-bleuNuit-900";

              if (isSelected && isAnswerSubmitted) {
                if (option.quality === "BEST") {
                  btnClass = "border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20";
                } else if (option.quality === "ACCEPTABLE") {
                  btnClass = "border-sky-500 bg-sky-50 text-sky-950 ring-2 ring-sky-500/20";
                } else if (option.quality === "PREMATURE") {
                  btnClass = "border-amber-400 bg-amber-50 text-amber-950 ring-2 ring-amber-400/20";
                } else {
                  btnClass = "border-rose-400 bg-rose-50 text-rose-950 ring-2 ring-rose-400/20";
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  data-testid={`inquiry-option-${idx}`}
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

          {/* Rétroaction immédiate (Didactic Feedback nuancé) */}
          {isAnswerSubmitted && selectedOption && (
            <div
              className={`p-5 rounded-xl border text-sm leading-relaxed space-y-3 ${
                selectedOption.quality === "BEST"
                  ? "bg-emerald-50/90 border-emerald-300 text-emerald-950"
                  : selectedOption.quality === "ACCEPTABLE"
                  ? "bg-sky-50/90 border-sky-300 text-sky-950"
                  : selectedOption.quality === "PREMATURE"
                  ? "bg-amber-50/90 border-amber-300 text-amber-950"
                  : "bg-rose-50/90 border-rose-300 text-rose-950"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2 border-current/10">
                <div className="flex items-center gap-2 font-bold">
                  {selectedOption.quality === "BEST" && (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>{isArabic ? "مسلك منهجي متقن" : "Démarche méthodologique optimale"}</span>
                    </>
                  )}
                  {selectedOption.quality === "ACCEPTABLE" && (
                    <>
                      <HelpCircle className="w-5 h-5 text-sky-600 shrink-0" />
                      <span>{isArabic ? "مسلك مقبول مع نقص في الاستيفاء" : "Démarche acceptable mais incomplète"}</span>
                    </>
                  )}
                  {selectedOption.quality === "PREMATURE" && (
                    <>
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                      <span>{isArabic ? "حكم متسرع يحتاج إلى تثبت" : "Jugement prématuré"}</span>
                    </>
                  )}
                  {selectedOption.quality === "INCORRECT" && (
                    <>
                      <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                      <span>{isArabic ? "تنبيه: خطأ منهجي صريح" : "Attention au piège méthodologique :"}</span>
                    </>
                  )}
                </div>

                <span className="px-2 py-0.5 rounded text-xs font-bold font-sans bg-white/70 border border-current/20">
                  {selectedOption.methodologicalScore}/3 pts
                </span>
              </div>

              <p className="leading-relaxed">
                {isArabic
                  ? selectedOption.feedbackAr || selectedOption.feedbackFr
                  : selectedOption.feedbackFr}
              </p>

              {/* Si des preuves ont été débloquées lors de cette étape */}
              {currentStep.revealedEvidenceIds.length > 0 &&
                currentStep.revealedEvidenceIds.some((id) => unlockedEvidenceIds.includes(id)) && (
                  <div className="pt-2 border-t border-current/10 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      {isArabic ? "وثيقة أضيفت إلى ملف التحقيق:" : "Document versé au dossier :"}
                    </span>
                    {currentStep.revealedEvidenceIds.map((evId) => {
                      const ev = evidenceMap.get(evId);
                      if (!ev) return null;
                      return (
                        <button
                          key={evId}
                          onClick={() => setSelectedEvidenceForDrawer(ev)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-white border border-current/30 hover:bg-white/80 transition shadow-xs"
                        >
                          <BookOpen className="w-3 h-3" />
                          <span>{ev.referenceCode}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

              {/* Boutons d'action */}
              <div className="pt-3 flex flex-wrap items-center justify-between gap-3">
                {selectedOption.quality !== "BEST" ? (
                  <span className="text-xs opacity-80">
                    {isArabic
                      ? "يمكنك تعديل اختيارك لتحسين مسلكك المنهجي، أو المتابعة."
                      : "Vous pouvez retenter l'étape pour affiner votre démarche, ou poursuivre."}
                  </span>
                ) : (
                  <span />
                )}

                <button
                  onClick={handleNextStep}
                  data-testid="inquiry-next"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-vertProfond-700 text-white font-semibold hover:bg-vertProfond-800 transition shadow-sm text-sm ms-auto"
                >
                  <span>
                    {isLastStep
                      ? isArabic
                        ? "عرض الفيشة الختامية للتحقيق"
                        : "Découvrir la conclusion documentée"
                      : isArabic
                      ? "الخطوة التالية"
                      : "Étape suivante"}
                  </span>
                  {isArabic ? (
                    <ArrowLeft className="w-4 h-4" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Preuves accumulées pendant l'enquête */}
      {unlockedEvidenceIds.length > 0 && !isConclusionUnlocked && (
        <div className="p-4 rounded-xl bg-sable-100/60 border border-sable-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-bleuNuit-900 flex items-center gap-1.5">
              <FileSearch className="w-4 h-4 text-vertProfond-700" />
              {isArabic ? "الأدلة التي جُمعت في هذا التحقيق:" : "Preuves recueillies au cours de l'enquête :"}
            </span>
            <span className="text-xs text-sable-500 font-sans">
              {unlockedEvidenceIds.length} {isArabic ? "وثيقة" : "document(s)"}
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

      {/* 5. Profil Méthodologique & Fiche de Conclusion */}
      {isConclusionUnlocked && (
        <div className="space-y-6">
          {/* Bandeau d'achèvement */}
          <div className="p-5 rounded-2xl bg-vertProfond-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-sable-200 shrink-0" />
              <div>
                <h3 className="text-base font-bold">
                  {isArabic
                    ? "اكتملت مراحل التحقيق المنهجي العشر بنجاح !"
                    : "Les 10 étapes d'investigation méthodologique sont complétées !"}
                </h3>
                <p className="text-xs text-sable-200 mt-0.5">
                  {isArabic
                    ? "تم تحليل الأثر وتوثيقه ومقارنة المسالك الفقهية بأدلتها."
                    : "L'allégation a été déconstruite, les sources primaires examinées et la divergence documentée."}
                </p>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold transition self-start sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isArabic ? "إعادة التحقيق" : "Recommencer l'enquête"}</span>
            </button>
          </div>

          {/* Profil Méthodologique en 3 Dimensions */}
          {profileAnalysis && (
            <div className="rounded-2xl border border-sable-300 bg-white p-6 shadow-sm space-y-4 text-start">
              <div className="flex items-center gap-2 border-b border-sable-100 pb-3">
                <Award className="w-5 h-5 text-vertProfond-700" />
                <h3 className="text-lg font-bold text-bleuNuit-900">
                  {isArabic ? "الملف المنهجي للباحث" : "Profil Méthodologique de l'Enquêteur"}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 1. Qualité de la vérification */}
                <div className="p-4 rounded-xl bg-sable-50 border border-sable-200 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-sable-600">
                    <ShieldCheck className="w-4 h-4 text-vertProfond-700" />
                    <span>{isArabic ? "جودة التثبت والتوثيق" : "Qualité de la vérification"}</span>
                  </div>
                  <div className="text-xl font-extrabold text-bleuNuit-900 font-sans">
                    {profileAnalysis.verification.score.toFixed(1)} / 3.0
                  </div>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${profileAnalysis.verification.colorClass}`}
                  >
                    {isArabic
                      ? profileAnalysis.verification.labelAr
                      : profileAnalysis.verification.labelFr}
                  </span>
                  <p className="text-[11px] text-sable-500 leading-snug">
                    {isArabic
                      ? "الرجوع للمصادر الأصلية والتحقق من الإسناد ومقارنة الروايات."
                      : "Recours aux sources primaires, analyse de l'isnâd et croisement des récits."}
                  </p>
                </div>

                {/* 2. Prudence épistémique */}
                <div className="p-4 rounded-xl bg-sable-50 border border-sable-200 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-sable-600">
                    <Brain className="w-4 h-4 text-vertProfond-700" />
                    <span>{isArabic ? "التريث والإنصاف العلمي" : "Prudence épistémique"}</span>
                  </div>
                  <div className="text-xl font-extrabold text-bleuNuit-900 font-sans">
                    {profileAnalysis.prudence.score.toFixed(1)} / 3.0
                  </div>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${profileAnalysis.prudence.colorClass}`}
                  >
                    {isArabic
                      ? profileAnalysis.prudence.labelAr
                      : profileAnalysis.prudence.labelFr}
                  </span>
                  <p className="text-[11px] text-sable-500 leading-snug">
                    {isArabic
                      ? "تفكيك الدعوى، والفصل بين النص وفهمه، وعدم التسرع في إسقاط الأقوال."
                      : "Décomposition des allégations, séparation texte/istidlâl et refus des raccourcis."}
                  </p>
                </div>

                {/* 3. Qualité de la conclusion */}
                <div className="p-4 rounded-xl bg-sable-50 border border-sable-200 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-sable-600">
                    <Scale className="w-4 h-4 text-vertProfond-700" />
                    <span>{isArabic ? "سداد الخلاصة ونسبتها" : "Qualité de la conclusion"}</span>
                  </div>
                  <div className="text-xl font-extrabold text-bleuNuit-900 font-sans">
                    {profileAnalysis.conclusion.score.toFixed(1)} / 3.0
                  </div>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${profileAnalysis.conclusion.colorClass}`}
                  >
                    {isArabic
                      ? profileAnalysis.conclusion.labelAr
                      : profileAnalysis.conclusion.labelFr}
                  </span>
                  <p className="text-[11px] text-sable-500 leading-snug">
                    {isArabic
                      ? "استيعاب طبيعة الخلاف الفقهي وصياغة حكم متوازن دون جزم باطل."
                      : "Compréhension du khilâf sa'igh et formulation d'un verdict mesuré et documenté."}
                  </p>
                </div>
              </div>

              {profileAnalysis.selfCorrectionsCount > 0 && (
                <div className="text-xs text-sable-500 bg-sable-50 p-3 rounded-lg border border-sable-200 flex items-center justify-between">
                  <span>
                    {isArabic
                      ? `تم رصد ${profileAnalysis.selfCorrectionsCount} تصويب(ات) ذاتي(ة) أثناء خطوات التحقيق.`
                      : `${profileAnalysis.selfCorrectionsCount} auto-correction(s) enregistrée(s) au fil des étapes.`}
                  </span>
                  <span className="font-semibold text-vertProfond-700">
                    {isArabic ? "مؤشر إيجابي على المراجعة النقدية" : "Indicateur positif d'esprit critique"}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Fiche de conclusion standardisée */}
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
