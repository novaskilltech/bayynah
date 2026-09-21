"use client";

import React, { useState } from "react";
import { FinalAssessmentScenario, AttestationData } from "@/types/skills";
import {
  recordSkillAttempt,
  saveStoredProfile,
  getStoredAttempts,
} from "@/lib/storage-adapter";
import { calculateMethodologicalProfile } from "@/lib/skills-calculator";
import { SKILLS_METADATA } from "@/lib/skills-registry";
import AttestationCard from "./AttestationCard";
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  RotateCcw,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";

interface FinalAssessmentRunnerProps {
  scenarios: FinalAssessmentScenario[];
  locale: string;
}

const SUCCESS_THRESHOLD = 75; // Seuil d'admissibilité à l'attestation (75%)

export default function FinalAssessmentRunner({ scenarios, locale }: FinalAssessmentRunnerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({}); // scenarioId -> score
  const [isCompleted, setIsCompleted] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [attestation, setAttestation] = useState<AttestationData | null>(null);

  const isArabic = locale === "ar";
  const currentScenario = scenarios[currentIndex];
  const progressPercent = Math.round(((currentIndex + 1) / scenarios.length) * 100);

  const handleSelectOption = (optionId: string) => {
    if (showFeedback) return;

    setSelectedOptionId(optionId);
    setShowFeedback(true);

    const opt = currentScenario.options.find((o) => o.id === optionId);
    if (!opt) return;

    setAnswers((prev) => ({ ...prev, [currentScenario.id]: opt.methodologicalScore }));

    recordSkillAttempt({
      skillId: currentScenario.primarySkill,
      sourceType: "FINAL_ASSESSMENT",
      sourceId: currentScenario.id,
      firstScore: opt.methodologicalScore,
      finalScore: opt.methodologicalScore,
      attemptCount: 1,
      correctedAfterFeedback: false,
    });
  };

  const handleNext = () => {
    if (currentIndex < scenarios.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOptionId(null);
      setShowFeedback(false);
    } else {
      // Fin de l'évaluation
      const totalPoints = Object.values(answers).reduce((a, b) => a + b, 0);
      const maxPoints = scenarios.length * 3;
      const finalScorePercent = Math.round((totalPoints / maxPoints) * 100);

      const allAttempts = getStoredAttempts();
      const newProfile = calculateMethodologicalProfile(allAttempts, true, true);
      saveStoredProfile(newProfile);

      if (finalScorePercent >= SUCCESS_THRESHOLD) {
        const uniqueId = `TAB-${new Date().getFullYear()}-${Math.random()
          .toString(36)
          .substring(2, 7)
          .toUpperCase()}`;

        const attestationData: AttestationData = {
          recipientName: recipientName.trim() || (isArabic ? "المتعلم المنهجي" : "Apprenant Méthodique"),
          issuedAt: new Date().toISOString(),
          attestationId: uniqueId,
          globalScore: finalScorePercent,
          masteredSkillsCount: newProfile.masteredSkillsCount,
          totalSkillsCount: 14,
          signatureAuthority: "Comité Pédagogique & Scientifique TABAYYUN",
          legalNoticeFr:
            "Cette attestation valide un parcours d'entraînement à l'esprit critique et aux règles de vérification méthodologique selon la tradition d'Ahl as-Sunnah wa-l-Jamāʿa. Elle ne constitue en aucun cas une ijāza religieuse, une habilitation à délivrer des avis juridiques (fatwas), ni un diplôme d'État.",
          legalNoticeAr:
            "هذه الإفادة تشهد بإتمام تدريب منهجي على التثبت العلمي وقواعد النقد وفق أصول أهل السنة والجماعة. ولا تُعد بحال من الأحوال إجازة رواية أو دراية، ولا تصريحاً بالفتوى والاجتهاد، ولا شهادة جامعية رسمية.",
        };
        setAttestation(attestationData);
      }

      setIsCompleted(true);
    }
  };

  const handleUpdateName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!attestation) return;
    setAttestation({
      ...attestation,
      recipientName: recipientName.trim() || (isArabic ? "المتعلم المنهجي" : "Apprenant Méthodique"),
    });
  };

  if (isCompleted) {
    const totalPoints = Object.values(answers).reduce((a, b) => a + b, 0);
    const maxPoints = scenarios.length * 3;
    const finalScorePercent = Math.round((totalPoints / maxPoints) * 100);
    const isEligible = finalScorePercent >= SUCCESS_THRESHOLD;

    return (
      <div className="space-y-8 text-start">
        {/* Résultat global */}
        <div className="rounded-2xl border border-sable-200 bg-white p-8 shadow-sm space-y-6 text-center">
          <div
            className={`inline-flex items-center justify-center w-16 h-16 rounded-full mx-auto ${
              isEligible
                ? "bg-vertProfond-50 border border-vertProfond-200 text-vertProfond-700"
                : "bg-amber-50 border border-amber-200 text-amber-700"
            }`}
          >
            {isEligible ? <Award className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-extrabold text-bleuNuit-900">
              {isEligible
                ? isArabic
                  ? "تهانينا! لقد أتممت التقويم الختامي بنجاح"
                  : "Félicitations ! Évaluation finale validée"
                : isArabic
                ? "نتيجة التقويم الختامي: في حاجة لمزيد تثبت"
                : "Évaluation terminée : consolidation recommandée"}
            </h2>
            <p className="text-sm text-sable-500 max-w-xl mx-auto">
              {isEligible
                ? isArabic
                  ? `أحرزت معدل ${finalScorePercent}% متجاوزاً عتبة الاستحقاق (${SUCCESS_THRESHOLD}%). يمكنك استلام إفادة التمكن المنهجي أدناه.`
                  : `Vous avez obtenu un score de ${finalScorePercent}%, franchissant le seuil requis (${SUCCESS_THRESHOLD}%). Votre attestation est disponible ci-dessous.`
                : isArabic
                ? `حصلت على ${finalScorePercent}%، بينما عتبة الاستحقاق هي ${SUCCESS_THRESHOLD}%. ننصحك بمراجعة الكفاءات التي شهدت تعجلاً ثم إعادة المحاولة.`
                : `Vous avez obtenu ${finalScorePercent}%, le seuil étant de ${SUCCESS_THRESHOLD}%. Nous vous invitons à consolider les compétences fragiles via la révision avant de retenter.`}
            </p>
          </div>

          <div className="max-w-xs mx-auto p-4 rounded-xl bg-sable-50 border border-sable-200">
            <span className="text-xs text-sable-500 font-medium block">
              {isArabic ? "معدل الرصانة في التحويل" : "Score de transfert méthodologique"}
            </span>
            <span className="text-4xl font-extrabold text-vertProfond-700">
              {finalScorePercent}%
            </span>
          </div>

          {!isEligible && (
            <div className="pt-4 flex justify-center gap-4">
              <Link
                href={`/${locale}/revision`}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-vertProfond-700 text-white font-semibold text-xs hover:bg-vertProfond-800 transition"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{isArabic ? "الانتقال إلى المراجعة" : "Consulter la révision adaptative"}</span>
              </Link>
            </div>
          )}
        </div>

        {/* Bloc Attestation si admissible */}
        {isEligible && attestation && (
          <div className="space-y-6">
            {/* Formulaire de personnalisation du nom */}
            <form
              onSubmit={handleUpdateName}
              className="p-5 rounded-2xl bg-white border border-sable-200 shadow-sm flex flex-col sm:flex-row items-center gap-3 no-print"
            >
              <label className="text-xs font-bold text-bleuNuit-900 shrink-0">
                {isArabic ? "الاسم المراد إدراجه في الإفادة:" : "Nom complet sur l'attestation :"}
              </label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder={isArabic ? "مثال: عبد الله بن محمد" : "Ex: Amina Benali"}
                className="flex-1 px-4 py-2 text-xs rounded-xl border border-sable-300 focus:outline-none focus:border-vertProfond-600"
              />
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-sable-800 text-white text-xs font-semibold hover:bg-bleuNuit-900 transition shrink-0"
              >
                {isArabic ? "تحديث الاسم" : "Mettre à jour"}
              </button>
            </form>

            {/* Carte officielle d'attestation */}
            <AttestationCard attestation={attestation} locale={locale} />
          </div>
        )}
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
              ? `سيناريو التحويل ${currentIndex + 1} من ${scenarios.length}`
              : `Scénario de transfert ${currentIndex + 1} sur ${scenarios.length}`}
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

      {/* Titre et Contexte */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-sable-100 text-vertProfond-800">
            {SKILLS_METADATA[currentScenario.primarySkill].name[isArabic ? "ar" : "fr"]}
          </span>
        </div>
        <h2 className="text-xl font-bold text-bleuNuit-900">
          {currentScenario.title[isArabic ? "ar" : "fr"]}
        </h2>

        <div className="p-4 rounded-xl bg-sable-50 border border-sable-200 text-sm text-bleuNuit-800 leading-relaxed space-y-2">
          <p>{currentScenario.contextDescription[isArabic ? "ar" : "fr"]}</p>
          <div className="pt-2 border-t border-sable-200 text-xs font-semibold text-vertProfond-900">
            {isArabic ? "الدعوى المطروحة للنقد:" : "Affirmation soumise à critique :"}
            <span className="font-normal text-bleuNuit-900 block mt-1">
              « {currentScenario.claim[isArabic ? "ar" : "fr"]} »
            </span>
          </div>
        </div>
      </div>

      {/* Options de réponse */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-sable-500">
          {isArabic ? "حدد التقييم المنهجي الأصوب:" : "Sélectionnez l'évaluation méthodologique la plus rigoureuse :"}
        </h3>
        <div className="space-y-2.5">
          {currentScenario.options.map((option) => {
            const isSelected = selectedOptionId === option.id;
            let borderClass = "border-sable-200 hover:border-sable-400 bg-white";
            let qualityBadge = null;

            if (showFeedback) {
              if (option.quality === "BEST") {
                borderClass = "border-vertProfond-500 bg-vertProfond-50/50";
                qualityBadge = (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-vertProfond-700 bg-vertProfond-100 px-2 py-0.5 rounded">
                    <CheckCircle2 className="w-3 h-3" />
                    {isArabic ? "الموقف الأكمل (+3)" : "Optimal (+3)"}
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
                      {isArabic ? "خلل منهجي (0)" : "Incorrect (0)"}
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
              {currentIndex < scenarios.length - 1
                ? isArabic
                  ? "الانتقال إلى السيناريو التالي"
                  : "Scénario suivant"
                : isArabic
                ? "إكمال التقويم وإصدار النتيجة"
                : "Finaliser l'évaluation"}
            </span>
            <ArrowRight className={`w-4 h-4 ${isArabic ? "rotate-180" : ""}`} />
          </button>
        </div>
      )}
    </div>
  );
}
