"use client";

import React from "react";
import { LEARNING_PATH_LEVELS } from "@/lib/learning-path";
import { SKILLS_METADATA } from "@/lib/skills-registry";
import { useLocalProgress } from "@/lib/useLocalProgress";
import { getLessonPath } from "@/lib/resource-paths";
import {
  CheckCircle2,
  Circle,
  BookOpen,
  Search,
  Sparkles,
  ChevronRight
} from "lucide-react";
import Link from "next/link";

interface LearningPathViewProps {
  locale: string;
}

export default function LearningPathView({ locale }: LearningPathViewProps) {
  const { completedLessons, completedInquiries } = useLocalProgress();

  const isArabic = locale === "ar";

  return (
    <div className="space-y-8 text-start">
      {/* Introduction */}
      <div className="p-6 rounded-2xl bg-white border border-sable-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-bleuNuit-900">
            {isArabic ? "مسار تعليمي متدرج في 5 مراحل" : "Parcours progressif en 5 paliers"}
          </h2>
          <p className="text-xs text-sable-500 max-w-2xl leading-relaxed">
            {isArabic
              ? "ينظم هذا المسار 20 درساً و10 تحقيقات متدرجة من بناء الحس النقدي العام إلى إتقان النقد الحديثي والأصولي والعقدي."
              : "Ce parcours articule les 20 leçons et 10 enquêtes, de la fondation critique générale jusqu'au transfert méthodologique avancé."}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs bg-sable-100 text-sable-600 px-3 py-1.5 rounded-lg font-medium">
            {isArabic ? "توجيه إرشادي غير مانع" : "Ordre conseillé non-bloquant"}
          </span>
        </div>
      </div>

      {/* Paliers du parcours */}
      <div className="space-y-6">
        {LEARNING_PATH_LEVELS.map((level) => {
          const totalItems = level.lessonIds.length + level.inquiryIds.length;
          const completedCount =
            level.lessonIds.filter((id) => completedLessons.includes(id)).length +
            level.inquiryIds.filter((id) => completedInquiries.includes(id)).length;
          const percent = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;
          const isLevelFinished = percent === 100;

          return (
            <div
              key={level.levelNumber}
              className={`rounded-2xl border transition-all p-6 md:p-8 bg-white shadow-sm space-y-6 ${
                isLevelFinished ? "border-vertProfond-300 bg-vertProfond-50/20" : "border-sable-200"
              }`}
            >
              {/* En-tête du niveau */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sable-100 pb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base shrink-0 ${
                      isLevelFinished
                        ? "bg-vertProfond-700 text-white"
                        : "bg-sable-100 text-bleuNuit-900 border border-sable-300"
                    }`}
                  >
                    {isLevelFinished ? <CheckCircle2 className="w-5 h-5" /> : level.levelNumber}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-bleuNuit-900">
                      {level.title[isArabic ? "ar" : "fr"]}
                    </h3>
                    <p className="text-xs text-sable-500">
                      {level.description[isArabic ? "ar" : "fr"]}
                    </p>
                  </div>
                </div>

                {/* Progression du niveau */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-end">
                    <span className="text-xs font-bold text-bleuNuit-900 block">
                      {completedCount} / {totalItems}
                    </span>
                    <span className="text-[10px] text-sable-400">
                      {isArabic ? "تم إنجازه" : "validé(s)"}
                    </span>
                  </div>
                  <div className="w-20 bg-sable-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-vertProfond-700 h-full transition-all duration-300"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Compétences ciblées */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-sable-400 block">
                  {isArabic ? "الكفاءات المستهدفة في هذا المستوى:" : "Compétences clés travaillées :"}
                </span>
                <div className="flex flex-wrap gap-2">
                  {level.targetSkills.map((sId) => (
                    <span
                      key={sId}
                      className="text-xs font-medium bg-sable-50 text-vertProfond-800 border border-sable-200 px-2.5 py-1 rounded-lg"
                    >
                      {SKILLS_METADATA[sId].name[isArabic ? "ar" : "fr"]}
                    </span>
                  ))}
                </div>
              </div>

              {/* Contenus : Leçons et Enquêtes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Leçons */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-bleuNuit-900">
                    <BookOpen className="w-4 h-4 text-vertProfond-700" />
                    <span>{isArabic ? "الدروس المنهجية" : "Leçons recommandées"}</span>
                  </div>
                  <div className="space-y-2">
                    {level.lessonIds.map((lSlug) => {
                      const isDone = completedLessons.includes(lSlug);
                      return (
                        <Link
                          key={lSlug}
                          href={getLessonPath(locale, lSlug)}
                          className="flex items-center justify-between p-3 rounded-xl border border-sable-100 hover:border-sable-300 bg-sable-50/40 hover:bg-sable-50 transition text-xs font-medium text-bleuNuit-900 group"
                        >
                          <div className="flex items-center gap-2.5">
                            {isDone ? (
                              <CheckCircle2 className="w-4 h-4 text-vertProfond-700 shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-sable-300 shrink-0" />
                            )}
                            <span className="group-hover:text-vertProfond-700 transition">
                              {lSlug}
                            </span>
                          </div>
                          <ChevronRight
                            className={`w-3.5 h-3.5 text-sable-400 group-hover:text-vertProfond-700 ${
                              isArabic ? "rotate-180" : ""
                            }`}
                          />
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* Enquêtes */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-bleuNuit-900">
                    <Search className="w-4 h-4 text-vertProfond-700" />
                    <span>{isArabic ? "قضايا التحقيق المعملية" : "Enquêtes interactives"}</span>
                  </div>
                  <div className="space-y-2">
                    {level.inquiryIds.map((iSlug) => {
                      const isDone = completedInquiries.includes(iSlug);
                      return (
                        <Link
                          key={iSlug}
                          href={`/${locale}/laboratoire/${iSlug}`}
                          className="flex items-center justify-between p-3 rounded-xl border border-sable-100 hover:border-sable-300 bg-sable-50/40 hover:bg-sable-50 transition text-xs font-medium text-bleuNuit-900 group"
                        >
                          <div className="flex items-center gap-2.5">
                            {isDone ? (
                              <CheckCircle2 className="w-4 h-4 text-vertProfond-700 shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-sable-300 shrink-0" />
                            )}
                            <span className="group-hover:text-vertProfond-700 transition">
                              {iSlug}
                            </span>
                          </div>
                          <ChevronRight
                            className={`w-3.5 h-3.5 text-sable-400 group-hover:text-vertProfond-700 ${
                              isArabic ? "rotate-180" : ""
                            }`}
                          />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Jalon du palier */}
              <div className="p-3.5 rounded-xl bg-sable-50 border border-sable-200/80 text-xs text-sable-600 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-vertProfond-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-bleuNuit-900">
                    {isArabic ? "المكتسب الختامي للمستوى: " : "Jalon de maîtrise : "}
                  </span>
                  <span>{level.milestoneDescription[isArabic ? "ar" : "fr"]}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
