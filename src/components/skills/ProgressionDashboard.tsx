"use client";

import React, { useSyncExternalStore } from "react";
import { MethodologicalProfile } from "@/types/skills";
import { getStoredProfile, initializeEmptyProfile } from "@/lib/storage-adapter";
import SkillBarList from "./SkillBarList";
import {
  Award,
  Brain,
  Compass,
  FileCheck,
  RotateCcw,
  Sparkles,
  TrendingUp
} from "lucide-react";
import Link from "next/link";

interface ProgressionDashboardProps {
  locale: string;
}

const emptySubscribe = () => () => {};

export default function ProgressionDashboard({ locale }: ProgressionDashboardProps) {
  const profile = useSyncExternalStore<MethodologicalProfile>(
    emptySubscribe,
    () => getStoredProfile() || initializeEmptyProfile(),
    () => initializeEmptyProfile()
  );

  const isArabic = locale === "ar";

  return (
    <div className="space-y-8 text-start">
      {/* Bannière de diagnostic non complété (si pertinent) */}
      {!profile.diagnosticCompleted && (
        <div className="rounded-2xl border border-vertProfond-200 bg-vertProfond-50/70 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-vertProfond-100 text-vertProfond-800">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-vertProfond-900">
                {isArabic ? "ابدأ بالتشخيص المنهجي الأولي" : "Passez le diagnostic méthodologique initial"}
              </h3>
              <p className="text-xs text-vertProfond-800/90">
                {isArabic
                  ? "14 مسألة سريعة لقياس مهاراتك ورسم خريطة كفاءاتك الدقيقة."
                  : "14 situations concrètes pour calibrer votre profil et vos priorités."}
              </p>
            </div>
          </div>

          <Link
            href={`/${locale}/diagnostic`}
            className="px-5 py-2.5 rounded-xl bg-vertProfond-700 text-white font-semibold text-xs hover:bg-vertProfond-800 transition shrink-0 shadow-sm"
          >
            {isArabic ? "بدء التشخيص الآن" : "Passer le diagnostic"}
          </Link>
        </div>
      )}

      {/* Cartes de synthèse globale */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-5 rounded-2xl bg-white border border-sable-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-sable-500 text-xs font-medium">
            <span>{isArabic ? "التحكم الإجمالي" : "Maîtrise globale"}</span>
            <TrendingUp className="w-4 h-4 text-vertProfond-700" />
          </div>
          <div className="text-3xl font-extrabold text-vertProfond-700">
            {profile.globalMasteryPercentage}%
          </div>
          <p className="text-[11px] text-sable-400">
            {isArabic ? "معدل موزون غير خطي" : "Moyenne pondérée non-linéaire"}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-sable-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-sable-500 text-xs font-medium">
            <span>{isArabic ? "كفاءات متقنة" : "Compétences maîtrisées"}</span>
            <Award className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-extrabold text-bleuNuit-900">
            {profile.masteredSkillsCount} <span className="text-base font-normal text-sable-400">/ 14</span>
          </div>
          <p className="text-[11px] text-sable-400">
            {isArabic ? "استقرار وتنوع سياقي" : ">85% avec diversité de contextes"}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-sable-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-sable-500 text-xs font-medium">
            <span>{isArabic ? "كفاءات صلبة" : "Compétences solides"}</span>
            <FileCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold text-bleuNuit-900">
            {profile.solidSkillsCount} <span className="text-base font-normal text-sable-400">/ 14</span>
          </div>
          <p className="text-[11px] text-sable-400">
            {isArabic ? "تمكن بين 66% و85%" : "Taux entre 66% et 85%"}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-sable-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-sable-500 text-xs font-medium">
            <span>{isArabic ? "كفاءات تم تقييمها" : "Compétences évaluées"}</span>
            <Compass className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-extrabold text-bleuNuit-900">
            {profile.evaluatedSkillsCount} <span className="text-base font-normal text-sable-400">/ 14</span>
          </div>
          <p className="text-[11px] text-sable-400">
            {isArabic ? "عبر الدروس والتحقيقات" : "Sur les 14 du référentiel"}
          </p>
        </div>
      </div>

      {/* Alertes de biais méthodologiques (si détectés) */}
      {profile.identifiedBiases.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-6 space-y-4">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
            <Brain className="w-5 h-5 text-amber-700" />
            <span>
              {isArabic ? "تنبيهات منهجية موجهة" : "Biais méthodologiques récurrents identifiés"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.identifiedBiases.map((bias) => (
              <div
                key={bias.id}
                className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-bleuNuit-900">
                    {bias.title[isArabic ? "ar" : "fr"]}
                  </span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-semibold">
                    {bias.occurrenceCount} {isArabic ? "تكرارات" : "fois"}
                  </span>
                </div>
                <p className="text-sable-600">{bias.description[isArabic ? "ar" : "fr"]}</p>
                <div className="pt-1 text-vertProfond-800 font-medium border-t border-sable-100">
                  👉 {bias.recommendedAction[isArabic ? "ar" : "fr"]}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <Link
              href={`/${locale}/revision`}
              className="inline-flex items-center gap-2 text-xs font-bold text-amber-900 hover:text-amber-950 underline underline-offset-4"
            >
              <span>{isArabic ? "بدء حصة المراجعة المستهدفة" : "Accéder à la révision adaptative"}</span>
            </Link>
          </div>
        </div>
      )}

      {/* Liste des compétences par catégorie */}
      <SkillBarList profile={profile} locale={locale} />

      {/* Raccourcis de navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-sable-200">
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/${locale}/parcours`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-sable-300 text-bleuNuit-900 text-xs font-semibold hover:bg-sable-50 transition"
          >
            <Compass className="w-4 h-4 text-vertProfond-700" />
            <span>{isArabic ? "المسار الموصى به" : "Parcours en 5 paliers"}</span>
          </Link>

          <Link
            href={`/${locale}/revision`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-sable-300 text-bleuNuit-900 text-xs font-semibold hover:bg-sable-50 transition"
          >
            <RotateCcw className="w-4 h-4 text-amber-600" />
            <span>{isArabic ? "مراجعة الأخطاء" : "Mode Révision"}</span>
          </Link>
        </div>

        <Link
          href={`/${locale}/evaluation-finale`}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-vertProfond-700 text-white text-xs font-semibold hover:bg-vertProfond-800 transition shadow-sm"
        >
          <Award className="w-4 h-4" />
          <span>{isArabic ? "التقويم الختامي والإفادة" : "Évaluation finale & Attestation"}</span>
        </Link>
      </div>
    </div>
  );
}
