"use client";

import React from "react";
import { MethodologicalProfile, MethodologicalSkill, SkillLevel } from "@/types/skills";
import { SKILLS_METADATA } from "@/lib/skills-registry";
import { BookOpen, Search, Scale, Brain } from "lucide-react";

interface SkillBarListProps {
  profile: MethodologicalProfile;
  locale: string;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  SOURCES: <BookOpen className="w-5 h-5 text-vertProfond-700" />,
  CRITIQUE_TEXTUELLE: <Search className="w-5 h-5 text-vertProfond-700" />,
  HERMENEUTIQUE: <Scale className="w-5 h-5 text-vertProfond-700" />,
  POSTURE_EPISTEMIQUE: <Brain className="w-5 h-5 text-vertProfond-700" />,
};

const CATEGORY_NAMES: Record<string, { fr: string; ar: string }> = {
  SOURCES: { fr: "Identification & Sources Primaires", ar: "توثيق الأصول والمصادر" },
  CRITIQUE_TEXTUELLE: { fr: "Critique Textuelle & Chaînes", ar: "النقد الحديثي والإسنادي" },
  HERMENEUTIQUE: { fr: "Compréhension & Herméneutique", ar: "فقه النصوص وطرق الاستدلال" },
  POSTURE_EPISTEMIQUE: { fr: "Posture Épistémique & Rigueur", ar: "الإنصاف والتجرد المنهجي" },
};

const LEVEL_CONFIG: Record<
  SkillLevel,
  { labelFr: string; labelAr: string; colorClass: string; bgClass: string; borderClass: string }
> = {
  UNTESTED: {
    labelFr: "Non évalué",
    labelAr: "غير مقيّم",
    colorClass: "text-sable-500",
    bgClass: "bg-sable-100",
    borderClass: "border-sable-300",
  },
  DISCOVERY: {
    labelFr: "Découverte",
    labelAr: "مرحلة الاستكشاف",
    colorClass: "text-amber-700",
    bgClass: "bg-amber-50",
    borderClass: "border-amber-300",
  },
  ACQUIRING: {
    labelFr: "En cours",
    labelAr: "قيد الاكتساب",
    colorClass: "text-blue-700",
    bgClass: "bg-blue-50",
    borderClass: "border-blue-300",
  },
  SOLID: {
    labelFr: "Solide",
    labelAr: "متمكن",
    colorClass: "text-indigo-700",
    bgClass: "bg-indigo-50",
    borderClass: "border-indigo-300",
  },
  MASTERED: {
    labelFr: "Maîtrisé",
    labelAr: "متقن ومستقر",
    colorClass: "text-vertProfond-700",
    bgClass: "bg-vertProfond-50",
    borderClass: "border-vertProfond-300",
  },
};

export default function SkillBarList({ profile, locale }: SkillBarListProps) {
  const isArabic = locale === "ar";

  const categories = ["SOURCES", "CRITIQUE_TEXTUELLE", "HERMENEUTIQUE", "POSTURE_EPISTEMIQUE"] as const;

  return (
    <div className="space-y-8 text-start">
      {categories.map((cat) => {
        const catSkills = (Object.keys(SKILLS_METADATA) as MethodologicalSkill[]).filter(
          (s) => SKILLS_METADATA[s].category === cat
        );

        return (
          <div key={cat} className="rounded-2xl border border-sable-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-sable-100 pb-4 mb-6">
              <div className="p-2 rounded-lg bg-sable-50 border border-sable-200">
                {CATEGORY_ICONS[cat]}
              </div>
              <div>
                <h3 className="text-lg font-bold text-bleuNuit-900">
                  {CATEGORY_NAMES[cat][isArabic ? "ar" : "fr"]}
                </h3>
                <p className="text-xs text-sable-500">
                  {catSkills.length} {isArabic ? "كفاءات منهجية" : "compétences ciblées"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {catSkills.map((skillId) => {
                const meta = SKILLS_METADATA[skillId];
                const mastery = profile.skills[skillId];
                const levelConfig = LEVEL_CONFIG[mastery.level];

                return (
                  <div
                    key={skillId}
                    className="p-4 rounded-xl border border-sable-100 hover:border-sable-300 transition bg-sable-50/50 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-semibold text-sm text-bleuNuit-900 leading-snug">
                          {meta.name[isArabic ? "ar" : "fr"]}
                        </h4>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${levelConfig.bgClass} ${levelConfig.colorClass} ${levelConfig.borderClass} shrink-0`}
                        >
                          {levelConfig[isArabic ? "labelAr" : "labelFr"]}
                        </span>
                      </div>
                      <p className="text-xs text-bleuNuit-700/80 mb-3">
                        {meta.shortDescription[isArabic ? "ar" : "fr"]}
                      </p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-sable-100">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-sable-500 font-medium">
                          {isArabic ? "نسبة التحكم" : "Taux de maîtrise"}
                        </span>
                        <span className="font-bold text-bleuNuit-900">
                          {mastery.scorePercentage}%
                        </span>
                      </div>

                      {/* Barre de progression */}
                      <div className="w-full bg-sable-200 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            mastery.level === "MASTERED"
                              ? "bg-vertProfond-700"
                              : mastery.level === "SOLID"
                              ? "bg-indigo-600"
                              : mastery.level === "ACQUIRING"
                              ? "bg-blue-600"
                              : mastery.level === "DISCOVERY"
                              ? "bg-amber-500"
                              : "bg-sable-300"
                          }`}
                          style={{ width: `${mastery.scorePercentage}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-sable-500 pt-1">
                        <span>
                          {isArabic
                            ? `${mastery.totalAttempts} مواقف تم اختبارها`
                            : `${mastery.totalAttempts} tentative(s)`}
                        </span>
                        <span>
                          {isArabic
                            ? `${mastery.distinctContextsCount} سياقات مختلفة`
                            : `${mastery.distinctContextsCount} contexte(s)`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
