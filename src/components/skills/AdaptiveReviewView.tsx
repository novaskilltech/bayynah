"use client";

import React from "react";
import { AdaptiveReviewItem } from "@/types/skills";
import { useLocalProgress } from "@/lib/useLocalProgress";
import { getLessonPath } from "@/lib/resource-paths";
import { getRecommendedReviews } from "@/lib/adaptive-review";
import { SKILLS_METADATA } from "@/lib/skills-registry";
import {
  AlertTriangle,
  BookOpen,
  Search,
  CheckCircle2,
  ArrowRight,
  Award
} from "lucide-react";
import Link from "next/link";

interface AdaptiveReviewViewProps {
  locale: string;
}

export default function AdaptiveReviewView({ locale }: AdaptiveReviewViewProps) {
  const { profile } = useLocalProgress();

  const reviews: AdaptiveReviewItem[] = getRecommendedReviews(profile);
  const isArabic = locale === "ar";

  return (
    <div className="space-y-8 text-start">
      {/* Introduction */}
      <div className="p-6 rounded-2xl bg-white border border-sable-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-bleuNuit-900">
            {isArabic ? "المراجعة الذكية والتصحيح المنهجي" : "Révision Adaptative & Renforcement"}
          </h2>
          <p className="text-xs text-sable-500 max-w-2xl leading-relaxed">
            {isArabic
              ? "يحلل هذا النظام إجاباتك غير المثالية ويعيد توجيهك إلى الدروس والخطوات الدقيقة لإصلاح الخلل دون أي حكم شخصي."
              : "Ce moteur cible vos hésitations et erreurs récurrentes pour vous proposer les leçons et étapes d'enquêtes précises à retravailler."}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-lg">
            {reviews.length} {isArabic ? "أولويات للمراجعة" : "priorité(s) ciblée(s)"}
          </span>
        </div>
      </div>

      {/* Cas où aucune révision n'est nécessaire */}
      {reviews.length === 0 ? (
        <div className="rounded-2xl border border-vertProfond-200 bg-vertProfond-50/50 p-8 md:p-12 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-vertProfond-100 text-vertProfond-800 mb-2">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-vertProfond-900">
            {isArabic
              ? "ممتاز! لا توجد كفاءات تتطلب مراجعة ملحة حالياً"
              : "Félicitations ! Aucune faiblesse critique détectée"}
          </h3>
          <p className="text-xs text-vertProfond-800 max-w-lg mx-auto leading-relaxed">
            {isArabic
              ? "مستواك مستقر في الكفاءات التي تم اختبارها حتى الآن. يمكنك متابعة التحقيقات المتبقية أو خوض التقويم الختامي."
              : "Vos réponses démontrent une bonne stabilité méthodologique. Vous pouvez aborder les enquêtes restantes ou passer l'évaluation finale de transfert."}
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link
              href={`/${locale}/parcours`}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white border border-sable-300 text-bleuNuit-900 text-xs font-semibold hover:bg-sable-50 transition"
            >
              <BookOpen className="w-4 h-4 text-vertProfond-700" />
              <span>{isArabic ? "متابعة المسار" : "Poursuivre le parcours"}</span>
            </Link>

            <Link
              href={`/${locale}/evaluation-finale`}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-vertProfond-700 text-white text-xs font-semibold hover:bg-vertProfond-800 transition shadow-sm"
            >
              <Award className="w-4 h-4" />
              <span>{isArabic ? "التقويم الختامي والإفادة" : "Passer l'évaluation finale"}</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Liste des révisions recommandées */
        <div className="space-y-6">
          {reviews.map((item) => {
            const meta = SKILLS_METADATA[item.skillId];
            const isHigh = item.urgency === "HIGH";

            return (
              <div
                key={item.id}
                className={`rounded-2xl border bg-white p-6 md:p-8 shadow-sm space-y-6 transition ${
                  isHigh ? "border-amber-300 bg-amber-50/20" : "border-sable-200"
                }`}
              >
                {/* En-tête de la révision */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sable-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-xl shrink-0 ${
                        isHigh ? "bg-amber-100 text-amber-800" : "bg-sable-100 text-bleuNuit-800"
                      }`}
                    >
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-bleuNuit-900">
                          {meta.name[isArabic ? "ar" : "fr"]}
                        </h3>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isHigh
                              ? "bg-amber-100 text-amber-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {isHigh
                            ? isArabic
                              ? "أولوية عالية"
                              : "Urgence haute"
                            : isArabic
                            ? "أولوية متوسطة"
                            : "Recommandé"}
                        </span>
                      </div>
                      <p className="text-xs text-sable-500 pt-0.5">
                        {item.reason[isArabic ? "ar" : "fr"]}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Ressources recommandées */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Leçons à relire */}
                  {item.recommendedLessons.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-bleuNuit-900 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-vertProfond-700" />
                        <span>{isArabic ? "دروس التأسيس النظري:" : "Leçons à relire :"}</span>
                      </h4>
                      <div className="space-y-2">
                        {item.recommendedLessons.map((lSlug) => (
                          <Link
                            key={lSlug}
                            href={getLessonPath(locale, lSlug)}
                            className="flex items-center justify-between p-3 rounded-xl border border-sable-200 hover:border-vertProfond-600 bg-white transition text-xs font-semibold text-bleuNuit-900 group"
                          >
                            <span>{lSlug}</span>
                            <ArrowRight
                              className={`w-3.5 h-3.5 text-sable-400 group-hover:text-vertProfond-700 ${
                                isArabic ? "rotate-180" : ""
                              }`}
                            />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Étapes d'enquêtes à refaire */}
                  {item.recommendedInquirySteps.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-bleuNuit-900 flex items-center gap-2">
                        <Search className="w-4 h-4 text-vertProfond-700" />
                        <span>{isArabic ? "خطوات للتدريب العملي في المعمل:" : "Étapes pratiques à refaire :"}</span>
                      </h4>
                      <div className="space-y-2">
                        {item.recommendedInquirySteps.map((step, idx) => (
                          <Link
                            key={idx}
                            href={`/${locale}/laboratoire/${step.inquiryId}?step=${step.stepNumber}`}
                            className="flex items-center justify-between p-3 rounded-xl border border-sable-200 hover:border-vertProfond-600 bg-white transition text-xs font-semibold text-bleuNuit-900 group"
                          >
                            <div>
                              <span className="text-vertProfond-800 font-bold block text-[11px]">
                                {step.inquiryId} • {isArabic ? `الخطوة ${step.stepNumber}` : `Étape ${step.stepNumber}`}
                              </span>
                              <span className="text-sable-600 font-normal">
                                {step.title[isArabic ? "ar" : "fr"]}
                              </span>
                            </div>
                            <ArrowRight
                              className={`w-3.5 h-3.5 text-sable-400 group-hover:text-vertProfond-700 shrink-0 ${
                                isArabic ? "rotate-180" : ""
                              }`}
                            />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
