"use client";

import React, { useRef } from "react";
import { AttestationData } from "@/types/skills";
import { Award, Printer, ShieldCheck } from "lucide-react";

interface AttestationCardProps {
  attestation: AttestationData;
  locale: string;
}

export default function AttestationCard({ attestation, locale }: AttestationCardProps) {
  const isArabic = locale === "ar";
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 text-start">
      {/* Barre d'action */}
      <div className="flex justify-end gap-3 no-print">
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-vertProfond-700 text-white hover:bg-vertProfond-800 text-sm font-semibold shadow-sm transition"
        >
          <Printer className="w-4 h-4" />
          <span>{isArabic ? "طباعة الإفادة أو حفظها كـ PDF" : "Imprimer ou exporter en PDF"}</span>
        </button>
      </div>

      {/* Carte d'attestation au format certificat */}
      <div
        ref={printRef}
        className="relative rounded-2xl border-4 border-double border-sable-300 bg-white p-8 md:p-12 shadow-md space-y-8 print:p-6 print:border-2 print:shadow-none"
      >
        {/* Filigrane décoratif d'arrière-plan */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
          <span className="text-9xl font-bold font-arabic">تَبَيُّن</span>
        </div>

        {/* En-tête officiel */}
        <div className="text-center space-y-3 border-b border-sable-200 pb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-vertProfond-50 border border-vertProfond-200 text-vertProfond-700 mb-2">
            <Award className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl md:text-3xl font-bold text-bleuNuit-900 font-arabic">
              {attestation.type === "MAITRISE_METHODOLOGIQUE"
                ? "إفادة تمكن منهجي في منصة تَبَيُّن"
                : "إفادة إتمام مسار في منصة تَبَيُّن"}
            </h2>
            <h3 className="text-lg md:text-xl font-semibold text-vertProfond-800 font-sans">
              {attestation.type === "MAITRISE_METHODOLOGIQUE"
                ? "Attestation de Maîtrise Méthodologique TABAYYUN"
                : "Attestation de Parcours TABAYYUN"}
            </h3>
          </div>

          <p className="text-xs uppercase tracking-widest text-sable-500 font-sans">
            Système d&apos;évaluation de la rigueur critique &amp; des compétences méthodologiques • {attestation.rulesVersion}
          </p>
        </div>

        {/* Corps de l'attestation */}
        <div className="space-y-6 text-center max-w-2xl mx-auto">
          <p className="text-sm text-sable-600">
            {isArabic ? "تُشهد المنصة بأن المتعلم(ة):" : "Il est attesté par la présente que :"}
          </p>

          <div className="py-2">
            <span className="text-2xl md:text-3xl font-bold text-bleuNuit-900 border-b-2 border-sable-400 pb-1 px-8">
              {attestation.recipientName || (isArabic ? "طالب العلم المنهجي" : "Apprenant Méthodique")}
            </span>
          </div>

          <p className="text-sm text-bleuNuit-800 leading-relaxed">
            {attestation.type === "MAITRISE_METHODOLOGIQUE"
              ? isArabic
                ? "قد أتم بنجاح البرنامج التكويني والتقويم الختامي للتحقق النقدي وفقه الاستدلال، وأثبت تمكنه واستقراره في الكفاءات المنهجية الأساسية والتنوع السياقي وفق المعايير المعتمدة."
                : "a complété avec succès le cursus de vérification critique et l'évaluation finale de transfert méthodologique, démontrant une maîtrise rigoureuse, solide et diversifiée des compétences d'Ahl as-Sunnah wa-l-Jamāʿa."
              : isArabic
              ? "قد أتم بنجاح مسار التحقق النقدي والتقويم الختامي، وأظهر استيعاباً طيباً للضوابط المنهجية العامة في التثبت وفقه الاستدلال."
              : "a complété avec succès le parcours d'apprentissage et l'évaluation finale de transfert, attestant de son engagement et de son assimilation des règles fondamentales du tabayyun."}
          </p>

          {/* Statistiques de maîtrise */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-y border-sable-100 py-4">
            <div className="p-3 bg-sable-50 rounded-xl border border-sable-200">
              <span className="block text-xs text-sable-500">
                {isArabic ? "النتيجة الإجمالية" : "Score global"}
              </span>
              <span className="text-xl font-bold text-vertProfond-700">
                {attestation.globalScore}%
              </span>
            </div>

            <div className="p-3 bg-sable-50 rounded-xl border border-sable-200">
              <span className="block text-xs text-sable-500">
                {isArabic ? "الكفاءات المتقنة" : "Compétences maîtrisées"}
              </span>
              <span className="text-xl font-bold text-vertProfond-700">
                {attestation.masteredSkillsCount} / {attestation.totalSkillsCount}
              </span>
            </div>

            <div className="p-3 bg-sable-50 rounded-xl border border-sable-200 col-span-2 sm:col-span-1">
              <span className="block text-xs text-sable-500">
                {isArabic ? "تاريخ الإصدار" : "Date de délivrance"}
              </span>
              <span className="text-sm font-semibold text-bleuNuit-900">
                {new Date(attestation.issuedAt).toLocaleDateString(isArabic ? "ar-SA" : "fr-FR")}
              </span>
            </div>
          </div>
        </div>

        {/* Pied de page et identifiants */}
        <div className="pt-6 border-t border-sable-200 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-sable-500">
          <div className="space-y-1 text-center md:text-start">
            <div>
              <span className="font-semibold text-bleuNuit-800">
                {isArabic ? "معرّف الإفادة: " : "Identifiant : "}
              </span>
              <code className="font-mono text-[11px] bg-sable-100 px-2 py-0.5 rounded">
                {attestation.attestationId}
              </code>
            </div>
            <div>
              <span>{isArabic ? "الجهة المصدرة: " : "Autorité : "}</span>
              <span>{attestation.signatureAuthority}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-vertProfond-700 font-medium">
            <ShieldCheck className="w-5 h-5" />
            <span>{isArabic ? "سجل إلكتروني معتمد" : "Registre numérique certifié"}</span>
          </div>
        </div>

        {/* Clause de non-ijāza et non-diplôme d'État (OBLIGATOIRE) */}
        <div className="mt-6 p-4 rounded-xl bg-sable-100/70 border border-sable-300 text-[11px] text-bleuNuit-800/90 leading-relaxed space-y-2">
          <div className="font-bold text-vertProfond-900">
            {isArabic ? "إخلاء مسؤولية منهجي وشرعي:" : "Clause de non-qualification religieuse :"}
          </div>
          <p>{attestation.legalNoticeFr}</p>
          <p className="font-arabic" dir="rtl">
            {attestation.legalNoticeAr}
          </p>
        </div>
      </div>
    </div>
  );
}
