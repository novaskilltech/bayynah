"use client";

import React, { useSyncExternalStore } from "react";
import { isTelemetryOptedOut, setTelemetryOptOut } from "@/lib/usePedagogicalTracker";
import { ShieldCheck, EyeOff } from "lucide-react";

interface PilotNoticeFooterProps {
  locale: string;
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("tabayyun-telemetry-opt-out-changed", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("tabayyun-telemetry-opt-out-changed", callback);
    window.removeEventListener("storage", callback);
  };
}

function getSnapshot(): boolean {
  return isTelemetryOptedOut();
}

function getServerSnapshot(): boolean {
  return false;
}

export default function PilotNoticeFooter({ locale }: PilotNoticeFooterProps) {
  const isArabic = locale === "ar";
  const optedOut = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = e.target.checked;
    setTelemetryOptOut(nextVal);
  };

  return (
    <div
      className="max-w-4xl mx-auto mt-6 pt-4 border-t border-sable-200/60 px-4 text-xs text-sable-500 flex flex-col sm:flex-row items-center justify-between gap-3"
      dir={isArabic ? "rtl" : "ltr"}
      role="region"
      aria-label={isArabic ? "إشعار الخصوصية والقياس البيداغوجي" : "Information sur la mesure pédagogique"}
    >
      <div className="flex items-center gap-2 text-start">
        <ShieldCheck className="w-4 h-4 text-vertProfond-700 shrink-0" aria-hidden="true" />
        <p className="leading-relaxed">
          {isArabic ? (
            <>
              <strong>قياس بيداغوجي مرحلي :</strong> بيانات بيداغوجية مؤقتة مرتبطة بمعرّف مستعار (حفظ 90 يوماً كحد أقصى، صفر عنوان IP محفوظ، صفر نصوص حرة). لا ترتبط بحساب المستخدم.
            </>
          ) : (
            <>
              <strong>Mesure pédagogique pilote :</strong> données statistiques pseudonymisées et éphémères (rétention 90 jours max, zéro adresse IP stockée, zéro texte libre). Zéro lien avec les comptes utilisateurs.
            </>
          )}
        </p>
      </div>

      <label className="inline-flex items-center gap-2 cursor-pointer select-none text-[11px] shrink-0 bg-white px-3 py-1.5 rounded-lg border border-sable-300 hover:border-sable-400 transition">
        <input
          type="checkbox"
          checked={optedOut}
          onChange={handleToggle}
          className="rounded border-sable-300 text-vertProfond-700 focus:ring-vertProfond-500 h-3.5 w-3.5"
          aria-label={isArabic ? "تعطيل القياس البيداغوجي" : "Désactiver la télémétrie pédagogique"}
        />
        <span className="flex items-center gap-1 text-sable-700">
          <EyeOff className="w-3 h-3 text-sable-500" aria-hidden="true" />
          {isArabic ? "تعطيل القياس" : "Désactiver la mesure"}
        </span>
      </label>
    </div>
  );
}
