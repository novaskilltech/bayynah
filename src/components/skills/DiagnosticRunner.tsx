"use client";

import React, { useState } from "react";
import { DiagnosticQuestion, MethodologicalProfile } from "@/types/skills";
import {
  recordSkillAttempt,
  saveStoredProfile,
  getStoredAttempts,
} from "@/lib/storage-adapter";
import { calculateMethodologicalProfile } from "@/lib/skills-calculator";
import { SKILLS_METADATA } from "@/lib/skills-registry";
import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  XCircle,
  ArrowRight,
  Award,
  Compass,
  TrendingUp,
  Brain,
} from "lucide-react";
import Link from "next/link";

interface DiagnosticRunnerProps {
  questions: DiagnosticQuestion[];
  locale: string;
}

export default function DiagnosticRunner({ questions, locale }: DiagnosticRunnerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [profile, setProfile] = useState<MethodologicalProfile | null>(null);

  const isArabic = locale === "ar";
  const currentQ = questions[currentIndex];
  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

  const handleSelectOption = (optionId: string) => {
    if (showFeedback) return; // Empêcher le changement une fois validé

    setSelectedOptionId(optionId);
    setShowFeedback(true);

    const opt = currentQ.options.find((o) => o.id === optionId);
    if (!opt) return;

    // Enregistrement unitaire de la tentative
    recordSkillAttempt({
      skillId: currentQ.primarySkill,
      sourceType: "DIAGNOSTIC",
      sourceId: currentQ.id,
      firstScore: opt.methodologicalScore,
      finalScore: opt.methodologicalScore,
      attemptCount: 1,
      correctedAfterFeedback: false,
    });
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOptionId(null);
      setShowFeedback(false);
    } else {
      // Fin du test : recalcul du profil global
      const allAttempts = getStoredAttempts();
      const newProfile = calculateMethodologicalProfile(allAttempts, true);
      saveStoredProfile(newProfile);
      setProfile(newProfile);
      setIsCompleted(true);
    }
  };

  if (isCompleted && profile) {
    return (
      <div className="rounded-2xl border border-sable-200 bg-white p-8 md:p-10 shadow-sm space-y-8 text-start">
        <div className="text-center space-y-3 border-b border-sable-100 pb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-vertProfond-50 border border-vertProfond-200 text-vertProfond-700">
            <Award className="w-8 h-8" />
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-bleuNuit-900">
            {isArabic ? "اكتمل الاختبار التشخيصي بنجاح" : "Diagnostic initial terminé avec succès"}
          </h2>
          <p className="text-sm text-sable-500 max-w-xl mx-auto">
            {isArabic
              ? "تم تحليل ردود أفعالك المنهجية عبر 14 كفاءة لتحديد منطلقاتك ونقاط القوة والمواطن التي تحتاج إلى ضبط."
              : "Vos réflexes méthodologiques ont été analysés sur 14 compétences pour calibrer votre parcours d'apprentissage."}
          </p>
        </div>

        {/* Score et bilan */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-xl bg-sable-50 border border-sable-200 text-center space-y-1">
            <span className="text-xs text-sable-500 font-medium">
              {isArabic ? "معدل الرصانة المنهجية" : "Score de rigueur globale"}
            </span>
            <div className="text-4xl font-extrabold text-vertProfond-700">
              {profile.globalMasteryPercentage}%
            </div>
          </div>

          <div className="p-5 rounded-xl bg-sable-50 border border-sable-200 text-center space-y-1">
            <span className="text-xs text-sable-500 font-medium">
              {isArabic ? "الكفاءات الصلبة / المتقنة" : "Compétences solides / maîtrisées"}
            </span>
            <div className="text-4xl font-extrabold text-bleuNuit-900">
              {profile.solidSkillsCount + profile.masteredSkillsCount} / 14
            </div>
          </div>

          <div className="p-5 rounded-xl bg-sable-50 border border-sable-200 text-center space-y-1">
            <span className="text-xs text-sable-500 font-medium">
              {isArabic ? "مواطن تحتاج لمراجعة" : "Compétences à consolider"}
            </span>
            <div className="text-4xl font-extrabold text-amber-600">
              {profile.weakestSkills.length}
            </div>
          </div>
        </div>

        {/* Points forts et axes d'amélioration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div className="p-5 rounded-xl border border-vertProfond-200 bg-vertProfond-50/50 space-y-3">
            <h3 className="font-bold text-sm text-vertProfond-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-vertProfond-700" />
              {isArabic ? "نقاط القوة البارزة" : "Points forts observés"}
            </h3>
            <ul className="space-y-2 text-xs text-vertProfond-800">
              {profile.strongestSkills.slice(0, 3).map((sId) => (
                <li key={sId} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-vertProfond-600 mt-1.5 shrink-0" />
                  <span>{SKILLS_METADATA[sId].name[isArabic ? "ar" : "fr"]}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-5 rounded-xl border border-amber-200 bg-amber-50/50 space-y-3">
            <h3 className="font-bold text-sm text-amber-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              {isArabic ? "أولويات التحسين والضبط" : "Axes d'amélioration prioritaires"}
            </h3>
            <ul className="space-y-2 text-xs text-amber-800">
              {profile.weakestSkills.slice(0, 3).map((sId) => (
                <li key={sId} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                  <span>{SKILLS_METADATA[sId].name[isArabic ? "ar" : "fr"]}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Tendances méthodologiques observées */}
        {(profile.identifiedPatterns || profile.identifiedBiases || []).length > 0 && (
          <div className="p-5 rounded-xl border border-sable-300 bg-sable-50 space-y-3">
            <h3 className="font-bold text-sm text-bleuNuit-900 flex items-center gap-2">
              <Brain className="w-4 h-4 text-vertProfond-700" />
              {isArabic ? "الأنماط والاتجاهات المنهجية المرصودة" : "Tendances méthodologiques observées"}
            </h3>
            <div className="space-y-3">
              {(profile.identifiedPatterns || profile.identifiedBiases || []).map((bias) => (
                <div key={bias.id} className="text-xs space-y-1 bg-white p-3 rounded-lg border border-sable-200">
                  <span className="font-bold text-bleuNuit-900 block">
                    {bias.title[isArabic ? "ar" : "fr"]}
                  </span>
                  <p className="text-sable-600">{bias.description[isArabic ? "ar" : "fr"]}</p>
                  <p className="text-vertProfond-800 font-medium pt-1">
                    👉 {bias.recommendedAction[isArabic ? "ar" : "fr"]}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Boutons d'action */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 border-t border-sable-100">
          <Link
            href={`/${locale}/progression`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-vertProfond-700 text-white font-semibold text-sm hover:bg-vertProfond-800 transition shadow-sm"
          >
            <TrendingUp className="w-4 h-4" />
            <span>{isArabic ? "عرض لوحة الكفاءات الكاملة" : "Consulter mon tableau de bord"}</span>
          </Link>

          <Link
            href={`/${locale}/parcours`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white border border-sable-300 text-bleuNuit-900 font-semibold text-sm hover:bg-sable-50 transition"
          >
            <Compass className="w-4 h-4" />
            <span>{isArabic ? "الانتقال إلى مسار التعلم" : "Découvrir le parcours recommandé"}</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-sable-200 bg-white p-6 md:p-8 shadow-sm space-y-6 text-start">
      {/* Barre de progression */}
      <div className="space-y-2 border-b border-sable-100 pb-4">
        <div className="flex justify-between items-center text-xs">
          <span className="text-sable-500 font-medium">
            {isArabic
              ? `المسألة ${currentIndex + 1} من ${questions.length}`
              : `Situation ${currentIndex + 1} sur ${questions.length}`}
          </span>
          <span className="font-bold text-vertProfond-700">{progressPercent}%</span>
        </div>
        <div className="w-full bg-sable-100 h-2 rounded-full overflow-hidden">
          <div
            className="bg-vertProfond-700 h-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Titre et situation */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-sable-100 text-vertProfond-800">
            {SKILLS_METADATA[currentQ.primarySkill].name[isArabic ? "ar" : "fr"]}
          </span>
        </div>
        <h2 className="text-xl font-bold text-bleuNuit-900">
          {currentQ.title[isArabic ? "ar" : "fr"]}
        </h2>
        <div className="p-4 rounded-xl bg-sable-50 border border-sable-200 text-sm text-bleuNuit-800 leading-relaxed">
          {currentQ.situation[isArabic ? "ar" : "fr"]}
        </div>
      </div>

      {/* Options de réponse */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-sable-500">
          {isArabic ? "اختر رد الفعل المنهجي الأنسب:" : "Choisissez le réflexe méthodologique le plus adapté :"}
        </h3>
        <div className="space-y-2.5">
          {currentQ.options.map((option) => {
            const isSelected = selectedOptionId === option.id;
            let borderClass = "border-sable-200 hover:border-sable-400 bg-white";
            let qualityBadge = null;

            if (showFeedback) {
              if (option.quality === "BEST") {
                borderClass = "border-vertProfond-500 bg-vertProfond-50/50";
                qualityBadge = (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-vertProfond-700 bg-vertProfond-100 px-2 py-0.5 rounded">
                    <CheckCircle2 className="w-3 h-3" />
                    {isArabic ? "المسلك الأمثل (+3)" : "Optimal (+3)"}
                  </span>
                );
              } else if (isSelected) {
                if (option.quality === "ACCEPTABLE") {
                  borderClass = "border-blue-400 bg-blue-50/50";
                  qualityBadge = (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                      <HelpCircle className="w-3 h-3" />
                      {isArabic ? "مقبول (+2)" : "Acceptable (+2)"}
                    </span>
                  );
                } else if (option.quality === "PREMATURE") {
                  borderClass = "border-amber-400 bg-amber-50/50";
                  qualityBadge = (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                      <AlertTriangle className="w-3 h-3" />
                      {isArabic ? "متعجل (+1)" : "Précipité (+1)"}
                    </span>
                  );
                } else {
                  borderClass = "border-red-400 bg-red-50/50";
                  qualityBadge = (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded">
                      <XCircle className="w-3 h-3" />
                      {isArabic ? "خطأ منهجي (0)" : "Incorrect (0)"}
                    </span>
                  );
                }
              }
            }

            return (
              <div
                key={option.id}
                onClick={() => handleSelectOption(option.id)}
                className={`p-4 rounded-xl border transition-all text-sm cursor-pointer ${borderClass}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-bleuNuit-900 leading-relaxed font-medium">
                    {option.text[isArabic ? "ar" : "fr"]}
                  </p>
                  {qualityBadge}
                </div>

                {showFeedback && (isSelected || option.quality === "BEST") && (
                  <div className="mt-3 pt-3 border-t border-sable-200/60 text-xs text-sable-600 leading-relaxed">
                    💡 {option.feedback[isArabic ? "ar" : "fr"]}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bouton de progression */}
      {showFeedback && (
        <div className="flex justify-end pt-4 border-t border-sable-100">
          <button
            onClick={handleNext}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-vertProfond-700 text-white font-semibold text-sm hover:bg-vertProfond-800 transition shadow-sm"
          >
            <span>
              {currentIndex < questions.length - 1
                ? isArabic
                  ? "الانتقال إلى المسألة التالية"
                  : "Question suivante"
                : isArabic
                ? "عرض نتيجة التشخيص"
                : "Voir mes résultats"}
            </span>
            <ArrowRight className={`w-4 h-4 ${isArabic ? "rotate-180" : ""}`} />
          </button>
        </div>
      )}
    </div>
  );
}
