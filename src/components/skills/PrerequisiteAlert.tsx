"use client";

import React, { useState, useSyncExternalStore } from "react";
import { checkPrerequisites } from "@/lib/learning-path";
import { getCompletedLessonSlugs, getCompletedInquirySlugs } from "@/lib/storage-adapter";
import { AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

interface PrerequisiteAlertProps {
  inquirySlug: string;
  locale: string;
}

const emptySubscribe = () => () => {};

export default function PrerequisiteAlert({ inquirySlug, locale }: PrerequisiteAlertProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  const completedLessons = useSyncExternalStore(
    emptySubscribe,
    () => getCompletedLessonSlugs(),
    () => []
  );
  const completedInquiries = useSyncExternalStore(
    emptySubscribe,
    () => getCompletedInquirySlugs(),
    () => []
  );

  const isArabic = locale === "ar";

  if (isDismissed) return null;

  const check = checkPrerequisites(completedLessons, completedInquiries, inquirySlug);

  if (!check.hasUnmetPrerequisites) return null;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-5 shadow-sm mb-6 text-start">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-2 flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-amber-900 text-sm">
              {isArabic
                ? "توصية منهجية: توجد متطلبات سابقة يُنصح بها"
                : "Recommandation méthodologique : Prérequis conseillés"}
            </h4>
            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-medium">
              {isArabic ? "توجيه غير مانع" : "Indicatif non-bloquant"}
            </span>
          </div>

          {check.reason && (
            <p className="text-xs text-amber-800/90 leading-relaxed">
              {check.reason[isArabic ? "ar" : "fr"]}
            </p>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            {check.missingLessons.map((lSlug) => (
              <Link
                key={lSlug}
                href={`/${locale}/ecoles/${lSlug}`}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-white text-amber-900 border border-amber-200 hover:bg-amber-100 transition"
              >
                <span>{isArabic ? `درس: ${lSlug}` : `Leçon: ${lSlug}`}</span>
                <ArrowRight className={`w-3 h-3 ${isArabic ? "rotate-180" : ""}`} />
              </Link>
            ))}
            {check.missingInquiries.map((iSlug) => (
              <Link
                key={iSlug}
                href={`/${locale}/laboratoire/${iSlug}`}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-white text-amber-900 border border-amber-200 hover:bg-amber-100 transition"
              >
                <span>{isArabic ? `تحقيق: ${iSlug}` : `Enquête: ${iSlug}`}</span>
                <ArrowRight className={`w-3 h-3 ${isArabic ? "rotate-180" : ""}`} />
              </Link>
            ))}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => setIsDismissed(true)}
              className="text-xs text-amber-900/80 hover:text-amber-950 font-medium underline underline-offset-2"
            >
              {isArabic
                ? "متابعة هذا التحقيق على أية حال"
                : "Poursuivre cette enquête quand même"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
