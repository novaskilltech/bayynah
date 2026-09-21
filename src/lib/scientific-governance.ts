/**
 * Moteur de Gouvernance Scientifique & Règles d'Invalidation
 * TABAYYUN — Plateforme d'esprit critique selon la méthodologie d'Ahl as-Sunnah wa-l-Jamâʿa
 *
 * Invariants fondamentaux :
 * 1. Sanctuaire Git : aucune écriture directe sur main ni en base de données.
 * 2. Invalidation automatique : toute modification d'une preuve VERIFIED_VERBATIM révoque son statut.
 * 3. Workflow éditorial strict : DRAFT -> IN_REVIEW -> APPROVED -> PUBLISHED -> ARCHIVED.
 * 4. Checklist scientifique de 11 points obligatoire avant approbation.
 */

export type EditorialStatus = "DRAFT" | "IN_REVIEW" | "APPROVED" | "PUBLISHED" | "ARCHIVED";

export type CitationStatus = "VERIFIED_VERBATIM" | "VERIFIED_PARAPHRASE" | "TO_BE_CHECKED";

export interface EvidenceRecord {
  id: string;
  type: string;
  referenceCode: string;
  citationStatus: CitationStatus;
  quoteArOriginal?: string;
  quoteFrTranslation?: string;
  work?: string;
  author?: string;
  edition?: string;
  volume?: number | string;
  page?: number | string;
  hadithNumber?: number | string;
  authenticityGrade?: string;
  verifiedAt?: string | null;
  verifiedBy?: string | null;
  [key: string]: unknown;
}

export interface InvalidationResult {
  hasCriticalChange: boolean;
  invalidatedEvidence: EvidenceRecord;
  changedFields: string[];
  invalidationReason?: string;
}

// Champs critiques dont la modification invalide immédiatement la vérification philologique
export const CRITICAL_SCIENTIFIC_FIELDS: Array<keyof EvidenceRecord> = [
  "quoteArOriginal",
  "quoteFrTranslation",
  "work",
  "author",
  "edition",
  "volume",
  "page",
  "hadithNumber",
  "authenticityGrade",
];

/**
 * Règle d'invalidation automatique :
 * Si une preuve VERIFIED_VERBATIM subit une modification sur un champ critique,
 * son statut est révoqué en TO_BE_CHECKED et les mentions de vérification sont effacées.
 */
export function applyEvidenceInvalidation(
  original: EvidenceRecord,
  updated: Partial<EvidenceRecord>
): InvalidationResult {
  const merged: EvidenceRecord = { ...original, ...updated };
  const changedFields: string[] = [];

  for (const field of CRITICAL_SCIENTIFIC_FIELDS) {
    const origVal = original[field];
    const updatedVal = updated[field];

    if (updatedVal !== undefined && String(origVal ?? "").trim() !== String(updatedVal ?? "").trim()) {
      changedFields.push(String(field));
    }
  }

  const hasCriticalChange = changedFields.length > 0;

  if (hasCriticalChange && original.citationStatus === "VERIFIED_VERBATIM") {
    return {
      hasCriticalChange: true,
      invalidatedEvidence: {
        ...merged,
        citationStatus: "TO_BE_CHECKED",
        verifiedAt: null,
        verifiedBy: null,
      },
      changedFields,
      invalidationReason: `Modification scientifique détectée sur [${changedFields.join(", ")}]. Statut révoqué : VERIFIED_VERBATIM -> TO_BE_CHECKED.`,
    };
  }

  return {
    hasCriticalChange,
    invalidatedEvidence: merged,
    changedFields,
  };
}

export interface EditorialTransitionContext {
  reviewerId?: string | null;
  reviewedAt?: string | null;
  evidences?: Array<{ id: string; citationStatus: CitationStatus }>;
}

/**
 * Valide une transition de statut éditorial selon les invariants stricts
 */
export function validateEditorialTransition(
  currentStatus: EditorialStatus,
  targetStatus: EditorialStatus,
  context: EditorialTransitionContext = {}
): { valid: boolean; error?: string } {
  if (currentStatus === targetStatus) {
    return { valid: true };
  }

  // Interdiction stricte de sauter de DRAFT à PUBLISHED directement
  if (currentStatus === "DRAFT" && targetStatus === "PUBLISHED") {
    return {
      valid: false,
      error: "Violation du workflow éditorial : passage direct de DRAFT à PUBLISHED interdit. Revue obligatoire (IN_REVIEW -> APPROVED).",
    };
  }

  // Transitions autorisées
  const allowedTransitions: Record<EditorialStatus, EditorialStatus[]> = {
    DRAFT: ["IN_REVIEW", "ARCHIVED"],
    IN_REVIEW: ["APPROVED", "DRAFT", "ARCHIVED"],
    APPROVED: ["PUBLISHED", "IN_REVIEW", "ARCHIVED"],
    PUBLISHED: ["ARCHIVED", "IN_REVIEW"],
    ARCHIVED: ["DRAFT"],
  };

  const allowed = allowedTransitions[currentStatus] || [];
  if (!allowed.includes(targetStatus)) {
    return {
      valid: false,
      error: `Transition de statut invalide : impossible de passer de ${currentStatus} à ${targetStatus}.`,
    };
  }

  // Critères stricts pour l'état PUBLISHED
  if (targetStatus === "PUBLISHED") {
    if (!context.reviewerId || !context.reviewedAt) {
      return {
        valid: false,
        error: "Publication refusée : un relecteur scientifique (reviewerId) et une date de revue (reviewedAt) sont obligatoires.",
      };
    }

    if (context.evidences && context.evidences.some((e) => e.citationStatus === "TO_BE_CHECKED")) {
      const pendingCount = context.evidences.filter((e) => e.citationStatus === "TO_BE_CHECKED").length;
      return {
        valid: false,
        error: `Publication refusée : ${pendingCount} preuve(s) demeure(nt) au statut TO_BE_CHECKED. Toutes les preuves doivent être vérifiées.`,
      };
    }
  }

  return { valid: true };
}

// 11 points de la checklist scientifique de révision
export const SCIENTIFIC_REVIEW_CHECKLIST = [
  {
    id: "check_primary_source",
    labelFr: "Source primaire vérifiée (manuscrit ou édition de référence reconnue)",
    labelAr: "المصدر الأصيل محقق ومعتمد",
  },
  {
    id: "check_verbatim_collated",
    labelFr: "Verbatim arabe collationné mot à mot avec la source",
    labelAr: "المتن العربي مقابل حرفياً على الأصل المطبوع",
  },
  {
    id: "check_edition_specified",
    labelFr: "Édition, maison d'édition et nom du muḥaqqiq / vérificateur précisés",
    labelAr: "بيان دار النشر، سنة الطبع، واسم المحقق بدقة",
  },
  {
    id: "check_pagination_coherent",
    labelFr: "Pagination, numéro de tome et numéro de hadith cohérents et vérifiés",
    labelAr: "الجزء والصفحة ورقم الحديث متطابقة تماماً",
  },
  {
    id: "check_faithful_translation",
    labelFr: "Traduction française fidèle, rigoureuse et sans extrapolation doctrinalement orientée",
    labelAr: "الترجمة دقيقة مطابقة للمعنى دون تحريف أو زيادة",
  },
  {
    id: "check_proportionate_conclusion",
    labelFr: "Conclusion proportionnée au degré d'établissement méthodologique (qath'î vs zannî)",
    labelAr: "النتيجة متناسبة مع رتبة الدليل قطعية وظنية",
  },
  {
    id: "check_no_orphan_evidence",
    labelFr: "Aucun evidenceId orphelin (chaque affirmation renvoie à une preuve définie)",
    labelAr: "كل دعوى مسندة إلى دليل محدد برقم تعريفي",
  },
  {
    id: "check_no_unproven_ijma",
    labelFr: "Aucun consensus (ijmâʿ) affirmé sans citation textuelle des savants l'attestant",
    labelAr: "عدم ادعاء الإجماع بغير نقل موثق عن أئمة الإجماع",
  },
  {
    id: "check_documented_salaf",
    labelFr: "Aucune attribution générique « les Salaf » sans chaîne de transmission ou ouvrage précis",
    labelAr: "عدم إطلاق نسبة القول للسلف دون تسمية وتوثيق",
  },
  {
    id: "check_no_istidlal_leap",
    labelFr: "Distinction méthodologique respectée : l'authenticité (ṣaḥīḥ) ne dispense pas d'un istidlāl correct",
    labelAr: "التفريق بين صحة ثبوت النص وصحة وجه الاستدلال به",
  },
  {
    id: "check_bilingual_coherence",
    labelFr: "Bilinguisme FR/AR cohérent, respectant la terminologie des uṣūl al-fiqh et du hadith",
    labelAr: "تناسق المصطلحات المنهجية بين اللغتين العربية والفرنسية",
  },
] as const;

export type ChecklistId = (typeof SCIENTIFIC_REVIEW_CHECKLIST)[number]["id"];

/**
 * Valide l'exhaustivité des réponses à la checklist en 11 points
 */
export function validateChecklistAnswers(answers: Record<string, boolean>): {
  complete: boolean;
  missingChecks: string[];
} {
  const missingChecks: string[] = [];

  for (const item of SCIENTIFIC_REVIEW_CHECKLIST) {
    if (!answers[item.id]) {
      missingChecks.push(item.id);
    }
  }

  return {
    complete: missingChecks.length === 0,
    missingChecks,
  };
}

export interface DiffEntry {
  path: string;
  field: string;
  oldValue: unknown;
  newValue: unknown;
  severity: "CRITICAL" | "WARNING" | "INFO";
  description: string;
}

/**
 * Calcule un diff scientifique intelligible entre deux versions d'une leçon ou enquête
 */
export function computeScientificDiff(
  original: Record<string, unknown>,
  proposed: Record<string, unknown>
): DiffEntry[] {
  const diffs: DiffEntry[] = [];

  // 1. Statut éditorial
  if (original.editorialStatus !== proposed.editorialStatus) {
    diffs.push({
      path: "editorialStatus",
      field: "Statut éditorial",
      oldValue: original.editorialStatus,
      newValue: proposed.editorialStatus,
      severity: "WARNING",
      description: `Transition éditoriale : ${original.editorialStatus} -> ${proposed.editorialStatus}`,
    });
  }

  // 2. Niveau de certitude
  if (original.certaintyLevel !== proposed.certaintyLevel) {
    diffs.push({
      path: "certaintyLevel",
      field: "Degré d'établissement (certaintyLevel)",
      oldValue: original.certaintyLevel,
      newValue: proposed.certaintyLevel,
      severity: "CRITICAL",
      description: `Changement de niveau épistémologique : ${original.certaintyLevel} -> ${proposed.certaintyLevel}`,
    });
  }

  // 3. Titres et résumés
  for (const key of ["titleFr", "titleAr", "summaryFr", "summaryAr"]) {
    if (original[key] !== proposed[key] && proposed[key] !== undefined) {
      diffs.push({
        path: key,
        field: key,
        oldValue: original[key],
        newValue: proposed[key],
        severity: "INFO",
        description: `Modification du texte de métadonnée : ${key}`,
      });
    }
  }

  // 4. Analyse des preuves (evidences)
  const origEvidences = (
    (original.conclusionSheet as { evidences?: EvidenceRecord[] })?.evidences ||
    original.evidences ||
    []
  ) as EvidenceRecord[];

  const propEvidences = (
    (proposed.conclusionSheet as { evidences?: EvidenceRecord[] })?.evidences ||
    proposed.evidences ||
    []
  ) as EvidenceRecord[];

  const origMap = new Map(origEvidences.map((e) => [e.id, e]));
  const propMap = new Map(propEvidences.map((e) => [e.id, e]));

  // Preuves supprimées
  for (const [id, orig] of origMap) {
    if (!propMap.has(id)) {
      diffs.push({
        path: `evidences.${id}`,
        field: `Evidence [${orig.referenceCode || id}]`,
        oldValue: orig.quoteArOriginal || orig.referenceCode,
        newValue: null,
        severity: "CRITICAL",
        description: `Suppression de la preuve ${orig.referenceCode || id}`,
      });
    }
  }

  // Preuves ajoutées ou modifiées
  for (const [id, prop] of propMap) {
    const orig = origMap.get(id);
    if (!orig) {
      diffs.push({
        path: `evidences.${id}`,
        field: `Evidence [${prop.referenceCode || id}]`,
        oldValue: null,
        newValue: prop.quoteArOriginal || prop.referenceCode,
        severity: "WARNING",
        description: `Ajout de la nouvelle preuve ${prop.referenceCode || id} (${prop.citationStatus})`,
      });
    } else {
      const inv = applyEvidenceInvalidation(orig, prop);
      if (inv.hasCriticalChange) {
        diffs.push({
          path: `evidences.${id}`,
          field: `Evidence [${prop.referenceCode || id}]`,
          oldValue: { status: orig.citationStatus, changed: inv.changedFields.map((f) => orig[f]) },
          newValue: { status: inv.invalidatedEvidence.citationStatus, changed: inv.changedFields.map((f) => prop[f]) },
          severity: "CRITICAL",
          description: inv.invalidationReason || `Champs critiques modifiés : ${inv.changedFields.join(", ")}`,
        });
      }
    }
  }

  return diffs;
}
