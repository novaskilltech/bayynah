"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { getGlossaryTerm } from "@/lib/glossary-data";
import { sendTelemetryEvent } from "@/lib/usePedagogicalTracker";
import { BookOpen, ExternalLink, X, AlertCircle, Lightbulb } from "lucide-react";

export interface GlossaryPopoverProps {
  termId: string;
  children?: React.ReactNode;
  locale?: string;
}

export default function GlossaryPopover({
  termId,
  children,
  locale = "fr",
}: GlossaryPopoverProps) {
  const isArabic = locale === "ar";
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const term = getGlossaryTerm(termId);

  // Gestion de la fermeture sur clic extérieur, touche Échap et piège de focus
  useEffect(() => {
    if (!isOpen) return;

    // Déplacer le focus dans le popover à l'ouverture pour l'accessibilité WAI-ARIA
    closeButtonRef.current?.focus();

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }

      // Piège de focus simple au sein du popover
      if (e.key === "Tab" && popoverRef.current) {
        const focusableElements = popoverRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Si le terme n'existe pas dans le dictionnaire, afficher le texte brut
  if (!term) {
    return <span>{children || termId}</span>;
  }

  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);

    if (nextState) {
      sendTelemetryEvent({
        eventType: "GLOSSARY_OPENED",
        resourceType: "glossary",
        resourceId: term.id,
        metadata: {
          termId: term.id,
          fromResource: typeof window !== "undefined" ? window.location.pathname : "unknown",
        },
      });
    }
  };

  const analogyText = isArabic ? term.analogyAr : term.analogyFr;
  const trapText = isArabic ? term.trapAr : term.trapFr;
  const definitionText = isArabic ? term.shortDefinitionAr : term.shortDefinitionFr;
  const popoverId = `glossary-popover-${term.id}`;
  const titleId = `glossary-title-${term.id}`;
  const descId = `glossary-desc-${term.id}`;

  return (
    <span className="relative inline-block text-left">
      {/* Déclencheur inline accessible WAI-ARIA */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={popoverId}
        className="inline-flex items-center text-inherit border-b-2 border-dotted border-vertProfond-500 hover:border-vertProfond-700 hover:text-vertProfond-800 transition-colors cursor-pointer font-medium focus:outline-hidden focus:ring-2 focus:ring-vertProfond-600 focus:ring-offset-1 rounded-xs"
        title={isArabic ? `انقر لقراءة تعريف: ${term.termAr}` : `Cliquer pour la définition de : ${term.termFr}`}
      >
        <span>{children || (isArabic ? term.termAr : term.termFr)}</span>
      </button>

      {/* Carte Popover */}
      {isOpen && (
        <div
          id={popoverId}
          ref={popoverRef}
          role="dialog"
          aria-labelledby={titleId}
          aria-describedby={descId}
          className="absolute z-50 mt-2 w-72 sm:w-84 p-4 bg-white rounded-2xl border border-sable-200 shadow-xl text-left animate-in fade-in zoom-in-95 duration-150"
          style={{
            left: isArabic ? "auto" : "0",
            right: isArabic ? "0" : "auto",
          }}
          dir={isArabic ? "rtl" : "ltr"}
        >
          {/* En-tête avec terme et bouton fermer */}
          <div className="flex items-start justify-between gap-2 border-b border-sable-100 pb-2.5 mb-2.5">
            <div>
              <div className="flex items-center gap-2">
                <span id={titleId} className="text-sm font-bold text-bleuNuit-900 font-arabic">
                  {term.termAr}
                </span>
                {!isArabic && (
                  <span className="text-xs text-sable-500 font-semibold">
                    • {term.termFr.split(" (")[0]}
                  </span>
                )}
              </div>
              <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full bg-sable-100 text-sable-700 text-[10px] font-bold uppercase tracking-wider">
                {term.category}
              </span>
            </div>

            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => {
                setIsOpen(false);
                triggerRef.current?.focus();
              }}
              className="p-1 rounded-lg text-sable-400 hover:text-bleuNuit-900 hover:bg-sable-100 transition focus:outline-hidden focus:ring-2 focus:ring-vertProfond-600"
              aria-label={isArabic ? "إغلاق نافذة التعريف" : "Fermer la fenêtre de définition"}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Définition courte */}
          <div id={descId} className="space-y-2.5 text-xs leading-relaxed text-sable-700">
            <p className="font-medium text-bleuNuit-900">
              {definitionText}
            </p>

            {/* Analogie moderne (100% bilingue) */}
            {analogyText && (
              <div className="p-2 rounded-lg bg-vertProfond-50/70 border border-vertProfond-100 text-vertProfond-900 flex items-start gap-2 text-[11px]">
                <Lightbulb className="w-3.5 h-3.5 text-vertProfond-700 shrink-0 mt-0.5" />
                <span>
                  <strong>{isArabic ? "مثال تقريبي:" : "Analogie :"}</strong> {analogyText}
                </span>
              </div>
            )}

            {/* Piège fréquent (100% bilingue) */}
            {trapText && (
              <div className="p-2 rounded-lg bg-amber-50/70 border border-amber-100 text-amber-900 flex items-start gap-2 text-[11px]">
                <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  <strong>{isArabic ? "المحذور الشائع:" : "Piège fréquent :"}</strong> {trapText}
                </span>
              </div>
            )}
          </div>

          {/* Lien vers la fiche complète */}
          <div className="pt-2.5 mt-2.5 border-t border-sable-100 flex items-center justify-between">
            <Link
              href={`/${locale}/lexique#${term.id}`}
              onClick={() => setIsOpen(false)}
              className="text-[11px] font-bold text-vertProfond-700 hover:text-vertProfond-900 flex items-center gap-1.5 transition focus:outline-hidden focus:ring-2 focus:ring-vertProfond-600 rounded-xs"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{isArabic ? "عرض الفهرس والمصادر" : "Consulter la fiche & sources"}</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </span>
  );
}
