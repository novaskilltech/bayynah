"use client";

import React, { useEffect } from "react";
import { EvidenceItem } from "@/types/evidence";
import EvidenceCard from "./EvidenceCard";
import { X } from "lucide-react";

interface EvidenceDrawerProps {
  evidence: EvidenceItem | null;
  isOpen: boolean;
  onClose: () => void;
  locale: string;
}

export default function EvidenceDrawer({
  evidence,
  isOpen,
  onClose,
  locale,
}: EvidenceDrawerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !evidence) return null;

  const isArabic = locale === "ar";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-bleuNuit-950/60 backdrop-blur-sm transition-opacity">
      {/* Clic en dehors pour fermer */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Panneau latéral */}
      <div
        className="relative z-10 w-full max-w-xl h-full bg-ivoire shadow-2xl overflow-y-auto p-6 space-y-6 flex flex-col justify-between border-s border-sable-200"
        dir={isArabic ? "rtl" : "ltr"}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-sable-200 pb-3">
            <h3 className="text-lg font-bold text-bleuNuit-900">
              {isArabic ? "بطاقة توثيق الدليل" : "Fiche de Preuve Scripturaire"}
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-sable-500 hover:bg-sable-200 transition"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <EvidenceCard evidence={evidence} locale={locale} />
        </div>

        <div className="pt-4 border-t border-sable-200 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-lg bg-sable-200 text-bleuNuit-900 font-semibold hover:bg-sable-300 transition text-sm"
          >
            {isArabic ? "إغلاق البطاقة" : "Fermer"}
          </button>
        </div>
      </div>
    </div>
  );
}
