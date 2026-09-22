"use client";

import React, { useState, useMemo } from "react";
import {
  ShieldAlert,
  GitPullRequest,
  CheckCircle2,
  AlertTriangle,
  FileText,
  BookOpen,
  ExternalLink,
} from "lucide-react";
import {
  SCIENTIFIC_REVIEW_CHECKLIST,
  computeScientificDiff,
  applyEvidenceInvalidation,
  applyInquiryEvidenceInvalidation,
  EvidenceRecord,
  InquiryEvidenceItem,
  EditorialStatus,
} from "@/lib/scientific-governance";

interface ReviewEditorProps {
  type: "lesson" | "inquiry";
  slug: string;
  initialContent: Record<string, unknown>;
  baseFileSha: string;
  locale: string;
  csrfToken: string;
  userRole: string;
}

export default function ReviewEditor({
  type,
  slug,
  initialContent,
  baseFileSha,
  locale,
  csrfToken,
  userRole: _userRole,
}: ReviewEditorProps) {
  const isArabic = locale === "ar";

  // État local de la proposition
  const [proposedContent, setProposedContent] = useState<Record<string, unknown>>(
    JSON.parse(JSON.stringify(initialContent))
  );

  // État de la checklist en 11 points
  const [checklistAnswers, setChecklistAnswers] = useState<Record<string, boolean>>(
    SCIENTIFIC_REVIEW_CHECKLIST.reduce((acc, item) => ({ ...acc, [item.id]: false }), {})
  );

  const [reviewerNotes, setReviewerNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStaleConflict, setIsStaleConflict] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    success: boolean;
    branchName?: string;
    pullRequestUrl?: string;
    error?: string;
  } | null>(null);

  // Calcul du diff scientifique en temps réel
  const diffs = useMemo(() => {
    return computeScientificDiff(initialContent, proposedContent);
  }, [initialContent, proposedContent]);

  // Détection des invalidations de preuves
  const invalidationAlerts = useMemo(() => {
    const alerts: string[] = [];
    if (type === "inquiry") {
      const origEvidences = ((initialContent.inquiryEvidences as InquiryEvidenceItem[]) || []);
      const propEvidences = ((proposedContent.inquiryEvidences as InquiryEvidenceItem[]) || []);
      const invResult = applyInquiryEvidenceInvalidation(origEvidences, propEvidences);
      alerts.push(...invResult.invalidations);
    } else if (type === "lesson" && proposedContent.historicReference && initialContent.historicReference) {
      const origRef = initialContent.historicReference as EvidenceRecord;
      const propRef = proposedContent.historicReference as EvidenceRecord;
      const inv = applyEvidenceInvalidation(origRef, propRef);
      if (inv.hasCriticalChange && inv.invalidationReason) {
        alerts.push(inv.invalidationReason);
      }
    }
    return alerts;
  }, [type, initialContent, proposedContent]);

  const allChecklistCompleted = useMemo(() => {
    return SCIENTIFIC_REVIEW_CHECKLIST.every((item) => checklistAnswers[item.id]);
  }, [checklistAnswers]);

  // Gestion de la modification d'un champ simple
  const handleFieldChange = (field: string, value: unknown) => {
    setProposedContent((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Gestion de la modification d'une preuve d'enquête
  const handleEvidenceFieldChange = (evidenceId: string, field: string, value: unknown) => {
    setProposedContent((prev) => {
      const clone = JSON.parse(JSON.stringify(prev));
      const inquiryEvidences = clone.inquiryEvidences as InquiryEvidenceItem[] | undefined;
      if (inquiryEvidences) {
        const target = inquiryEvidences.find((e) => e.evidenceId === evidenceId || e.evidence?.id === evidenceId);
        if (target && target.evidence) {
          target.evidence[field] = value;
        }
      }
      return clone;
    });
  };

  // Soumission de la proposition vers l'API
  const handleSubmitProposal = async () => {
    if (!allChecklistCompleted) {
      alert(
        isArabic
          ? "يجب استيفاء جميع بنود قائمة التحقق العلمي (11 بنداً) قبل تقديم الاقتراح."
          : "Tous les 11 points de la checklist scientifique doivent être cochés avant de soumettre la proposition."
      );
      return;
    }

    setIsSubmitting(true);
    setSubmissionResult(null);
    setIsStaleConflict(false);

    try {
      const res = await fetch("/api/admin/proposals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({
          type,
          slug,
          proposedContent,
          checklistAnswers,
          reviewerNotes,
          baseFileSha,
        }),
      });

      const data = await res.json();
      if (res.status === 409) {
        setIsStaleConflict(true);
        throw new Error(data.error || "Conflit d'édition (Stale Edit) : le fichier a été modifié sur le serveur. Veuillez recharger la page.");
      }

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la création de la proposition.");
      }

      setSubmissionResult({
        success: true,
        branchName: data.proposal?.branchName,
        pullRequestUrl: data.proposal?.pullRequestUrl,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSubmissionResult({
        success: false,
        error: msg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inquiryEvidences = (
    type === "inquiry"
      ? (proposedContent.inquiryEvidences as InquiryEvidenceItem[]) || []
      : []
  );

  return (
    <div className="space-y-8" dir={isArabic ? "rtl" : "ltr"}>
      {/* Alerte Règle d'or Sanctuaire Git */}
      <div className="p-4 rounded-2xl bg-bleuNuit-900 text-white flex items-start gap-4 shadow-sm">
        <div className="p-2.5 rounded-xl bg-bleuNuit-800 text-amber-300 shrink-0">
          <GitPullRequest className="w-6 h-6" />
        </div>
        <div className="space-y-1 text-xs leading-relaxed">
          <h3 className="font-bold text-sm text-amber-300 font-arabic">
            {isArabic ? "قاعدة الأمان المنهجي: لا تعديل مباشر على النسخة المنشورة" : "Sanctuaire Git & Workflow de Pull Request"}
          </h3>
          <p className="text-sable-300">
            {isArabic
              ? "أي تعديل تقترحه هنا لن يُكتب مباشرة في قاعدة البيانات أو في فرع main، بل يُنشئ فرعاً مخصصاً (review/...) وطلب دمج (Pull Request) يخضع لفحص بوابات النزاهة العلمية وCI قبل الدمج النهائي."
              : "Toute modification proposée ici ne sera JAMAIS écrite directement en base ni sur la branche main. Elle générera une branche dédiée (review/...) et une Pull Request soumise à l'Integrity Gate et à la CI avant toute revue humaine."}
          </p>
        </div>
      </div>

      {/* Alerte d'invalidation automatique si applicable */}
      {invalidationAlerts.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm">
            <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0" />
            <span>{isArabic ? "تنبيه إسقاط التوثيق التلقائي" : "Règle d'Invalidation Scientifique Automatique Déclenchée"}</span>
          </div>
          <p className="text-xs text-amber-800">
            {isArabic
              ? "تم تعديل حقول أصيلة في أدلة كانت محققة لفظياً (VERIFIED_VERBATIM). سيتم إسقاط حالتها تلقائياً إلى (TO_BE_CHECKED) حتى يُعاد فحصها يدوياً."
              : "Des champs critiques d'Evidence au statut VERIFIED_VERBATIM ont été modifiés. Leur statut sera automatiquement révoqué en TO_BE_CHECKED pour exiger un nouveau collationnement."}
          </p>
          <ul className="text-xs list-disc list-inside space-y-1 pl-2">
            {invalidationAlerts.map((alert, idx) => (
              <li key={idx} className="font-mono">{alert}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Affichage côte à côte : Édition & Aperçu du Diff */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Colonne Gauche : Formulaire d'édition de la proposition */}
        <div className="bg-white p-6 rounded-2xl border border-sable-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-sable-200 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-vertProfond-800" />
              <h2 className="font-bold text-bleuNuit-900 text-base">
                {isArabic ? "تعديل محتوى المسودة المقترحة" : "Édition de la Proposition"}
              </h2>
            </div>
            <span className="px-2 py-0.5 rounded bg-sable-100 text-sable-700 text-xs font-mono font-bold">
              {slug}
            </span>
          </div>

          {/* Statut éditorial ciblé */}
          <div>
            <label className="block text-xs font-bold text-sable-700 uppercase tracking-wider mb-1">
              {isArabic ? "الحالة التحريرية المستهدفة" : "Statut Éditorial Ciblé"}
            </label>
            <select
              value={(proposedContent.editorialStatus as string) || "DRAFT"}
              onChange={(e) => handleFieldChange("editorialStatus", e.target.value as EditorialStatus)}
              className="w-full text-xs p-2.5 rounded-xl border border-sable-300 bg-sable-50 font-semibold focus:outline-hidden focus:ring-2 focus:ring-vertProfond-600"
            >
              <option value="DRAFT">DRAFT (Brouillon)</option>
              <option value="IN_REVIEW">IN_REVIEW (En cours de révision scientifique)</option>
              <option value="APPROVED">APPROVED (Approuvé par le relecteur)</option>
              <option value="PUBLISHED" disabled={invalidationAlerts.length > 0}>
                PUBLISHED (Publication — Exige 0 TO_BE_CHECKED)
              </option>
              <option value="ARCHIVED">ARCHIVED (Archivé)</option>
            </select>
          </div>

          {/* Titres */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-sable-700 uppercase tracking-wider mb-1">
                {isArabic ? "العنوان بالفرنسية" : "Titre Français"}
              </label>
              <input
                type="text"
                value={(type === "lesson" ? proposedContent.titleFr : (proposedContent.title as { fr?: string })?.fr) as string || ""}
                onChange={(e) => {
                  if (type === "lesson") handleFieldChange("titleFr", e.target.value);
                  else handleFieldChange("title", { ...(proposedContent.title as object), fr: e.target.value });
                }}
                className="w-full text-xs p-2.5 rounded-xl border border-sable-300 focus:outline-hidden focus:ring-2 focus:ring-vertProfond-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-sable-700 uppercase tracking-wider mb-1">
                {isArabic ? "العنوان بالعربية" : "Titre Arabe"}
              </label>
              <input
                type="text"
                dir="rtl"
                value={(type === "lesson" ? proposedContent.titleAr : (proposedContent.title as { ar?: string })?.ar) as string || ""}
                onChange={(e) => {
                  if (type === "lesson") handleFieldChange("titleAr", e.target.value);
                  else handleFieldChange("title", { ...(proposedContent.title as object), ar: e.target.value });
                }}
                className="w-full text-xs p-2.5 rounded-xl border border-sable-300 font-arabic focus:outline-hidden focus:ring-2 focus:ring-vertProfond-600"
              />
            </div>
          </div>

          {/* Édition des Preuves (pour les enquêtes) */}
          {type === "inquiry" && inquiryEvidences.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-sable-200">
              <h3 className="text-xs font-bold text-bleuNuit-900 uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-vertProfond-700" />
                <span>{isArabic ? "الأدلة والشواهد المنقولة" : "Preuves Scientifiques & Verbatim"}</span>
              </h3>

              <div className="space-y-3">
                {inquiryEvidences.map((item) => {
                  const ev = item.evidence;
                  const evId = item.evidenceId || ev?.id;
                  if (!ev) return null;

                  return (
                    <div key={evId} className="p-3.5 rounded-xl border border-sable-200 bg-sable-50 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-bleuNuit-900">{ev.referenceCode || evId}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ev.citationStatus === "VERIFIED_VERBATIM"
                              ? "bg-green-100 text-green-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {ev.citationStatus}
                        </span>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-sable-600 mb-1">
                          {isArabic ? "المتن الأصلي (عربي)" : "Verbatim Arabe Original"}
                        </label>
                        <textarea
                          dir="rtl"
                          rows={3}
                          value={ev.quoteArOriginal || ""}
                          onChange={(e) => handleEvidenceFieldChange(evId, "quoteArOriginal", e.target.value)}
                          className="w-full text-xs p-2 rounded-lg border border-sable-300 font-arabic focus:outline-hidden focus:ring-2 focus:ring-vertProfond-600 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-sable-600 mb-1">
                          {isArabic ? "الترجمة الفرنسية" : "Traduction Française"}
                        </label>
                        <textarea
                          rows={2}
                          value={ev.translationFr || ""}
                          onChange={(e) => handleEvidenceFieldChange(evId, "translationFr", e.target.value)}
                          className="w-full text-xs p-2 rounded-lg border border-sable-300 focus:outline-hidden focus:ring-2 focus:ring-vertProfond-600 bg-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-semibold text-sable-600">Ouvrage / Source</label>
                          <input
                            type="text"
                            value={(ev.sourceWork || ev.collection || ev.work || "") as string}
                            onChange={(e) => {
                              handleEvidenceFieldChange(evId, "sourceWork", e.target.value);
                              handleEvidenceFieldChange(evId, "collection", e.target.value);
                            }}
                            className="w-full text-xs p-1.5 rounded border border-sable-300 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-sable-600">Auteur / Savant</label>
                          <input
                            type="text"
                            value={(ev.author || "") as string}
                            onChange={(e) => handleEvidenceFieldChange(evId, "author", e.target.value)}
                            className="w-full text-xs p-1.5 rounded border border-sable-300 bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes du relecteur */}
          <div>
            <label className="block text-xs font-bold text-sable-700 uppercase tracking-wider mb-1">
              {isArabic ? "ملاحظات وتبرير المراجعة العلمية" : "Justification & Notes de Révision"}
            </label>
            <textarea
              rows={3}
              value={reviewerNotes}
              onChange={(e) => setReviewerNotes(e.target.value)}
              placeholder={
                isArabic
                  ? "بيان سبب التعديل، والنسخة المعتمدة في التصحيح، والمراجع المحال إليها..."
                  : "Expliquez les motifs de la correction, les références des éditions consultées..."
              }
              className="w-full text-xs p-3 rounded-xl border border-sable-300 focus:outline-hidden focus:ring-2 focus:ring-vertProfond-600"
            />
          </div>
        </div>

        {/* Colonne Droite : Diff Scientifique & Checklist 11 Points */}
        <div className="space-y-6">
          {/* Diff Scientifique */}
          <div className="bg-white p-6 rounded-2xl border border-sable-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-sable-200 pb-3">
              <h2 className="font-bold text-bleuNuit-900 text-base flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span>{isArabic ? "الفروق العلمية المرصودة" : "Diff Scientifique"}</span>
              </h2>
              <span className="text-xs text-sable-500 font-semibold">
                {diffs.length} {isArabic ? "تغييرات" : "modification(s)"}
              </span>
            </div>

            {diffs.length === 0 ? (
              <div className="p-6 text-center text-xs text-sable-500 bg-sable-50 rounded-xl">
                {isArabic ? "لا توجد أي فروق بين الأصل والمسودة المقترحة." : "Aucune modification détectée par rapport à la version publiée."}
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {diffs.map((d, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border text-xs space-y-1 ${
                      d.severity === "CRITICAL"
                        ? "bg-red-50/70 border-red-200 text-red-900"
                        : d.severity === "WARNING"
                        ? "bg-amber-50/70 border-amber-200 text-amber-900"
                        : "bg-sable-50 border-sable-200 text-sable-800"
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span>{d.field}</span>
                      <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/80 border border-current">
                        {d.severity}
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed">{d.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Checklist Scientifique (11/11 Obligatoire) */}
          <div className="bg-white p-6 rounded-2xl border border-sable-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-sable-200 pb-3">
              <h2 className="font-bold text-bleuNuit-900 text-base flex items-center gap-2 font-arabic">
                <CheckCircle2 className="w-5 h-5 text-vertProfond-700" />
                <span>{isArabic ? "قائمة التحقق العلمي (11 بنداً)" : "Checklist de Relecture (11 Points)"}</span>
              </h2>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded ${
                  allChecklistCompleted
                    ? "bg-green-100 text-green-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {Object.values(checklistAnswers).filter(Boolean).length} / 11
              </span>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {SCIENTIFIC_REVIEW_CHECKLIST.map((item) => (
                <label
                  key={item.id}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-sable-50 cursor-pointer text-xs"
                >
                  <input
                    type="checkbox"
                    checked={checklistAnswers[item.id] || false}
                    onChange={(e) =>
                      setChecklistAnswers((prev) => ({ ...prev, [item.id]: e.target.checked }))
                    }
                    className="mt-0.5 h-4 w-4 rounded border-sable-300 text-vertProfond-700 focus:ring-vertProfond-600"
                  />
                  <span className="text-sable-700 leading-snug font-arabic">
                    {isArabic ? item.labelAr : item.labelFr}
                  </span>
                </label>
              ))}
            </div>

            {/* Bouton d'action strict : Proposer une modification */}
            <div className="pt-4 border-t border-sable-200">
              <button
                type="button"
                onClick={handleSubmitProposal}
                disabled={isSubmitting || !allChecklistCompleted}
                className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition ${
                  allChecklistCompleted && !isSubmitting
                    ? "bg-vertProfond-700 hover:bg-vertProfond-800 text-white shadow-sm"
                    : "bg-sable-200 text-sable-400 cursor-not-allowed"
                }`}
              >
                <GitPullRequest className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? isArabic
                      ? "جار إنشاء الفرع والطلب..."
                      : "Création de la branche et de la PR..."
                    : isArabic
                    ? "تقديم مقترح المراجعة (فتح Pull Request)"
                    : "Proposer une modification (Créer Pull Request)"}
                </span>
              </button>
              <p className="text-[11px] text-center text-sable-500 mt-2">
                {isArabic
                  ? "لا يوجد زر للنشر المباشر. يُشترط استيفاء 11 بنداً كاملاً ونجاح فحص CI."
                  : "Aucun bouton de publication directe. Exige 11/11 validations et un passage vert de la CI."}
              </p>
            </div>
          </div>

          {/* Résultat de la soumission */}
          {submissionResult && (
            <div
              className={`p-4 rounded-2xl border text-xs space-y-2 ${
                submissionResult.success
                  ? "bg-green-50 border-green-300 text-green-900"
                  : "bg-red-50 border-red-300 text-red-900"
              }`}
            >
              {submissionResult.success ? (
                <>
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-green-700" />
                    <span>{isArabic ? "تم إنشاء طلب الدمج بنجاح" : "Pull Request Ouverte avec Succès !"}</span>
                  </div>
                  <p>
                    {isArabic
                      ? "تم إنشاء فرع المراجعة بنجاح وفتح طلب الدمج. بانتظار تشغيل واجتياز CI."
                      : "La proposition a été enregistrée. Une branche dédiée et une Pull Request ont été créées."}
                  </p>
                  <div className="p-2.5 rounded-lg bg-white/80 border border-green-200 space-y-1 font-mono text-[11px]">
                    <div>Branche : <span className="font-bold">{submissionResult.branchName}</span></div>
                    {submissionResult.pullRequestUrl && (
                      <div>
                        PR :{" "}
                        <a
                          href={submissionResult.pullRequestUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-vertProfond-800 underline inline-flex items-center gap-1"
                        >
                          <span>{submissionResult.pullRequestUrl}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <AlertTriangle className="w-5 h-5 text-red-700" />
                    <span>{isArabic ? "تعذر تقديم المقترح" : "Échec de la Création de la Proposition"}</span>
                  </div>
                  <p>{submissionResult.error}</p>
                  {isStaleConflict && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="px-3 py-1.5 rounded-lg bg-red-800 text-white font-bold text-xs hover:bg-red-900 transition"
                      >
                        {isArabic ? "إعادة تحميل الصفحة لمزامنة المحتوى" : "Recharger la page pour synchroniser"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
