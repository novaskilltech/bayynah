import { z } from "zod";
import { EditorialStatusEnum, SchoolTypeEnum } from "./lesson.schema";
import { EvidenceSchema } from "./evidence.schema";

export const CertaintyLevelEnum = z.enum([
  "ETABLI",
  "FORTEMENT_ETABLI",
  "KHILAF_RECONNU",
  "EXPERTISE_REQUISE",
  "INSUFFISANT",
]);

export const EvidenceRoleEnum = z.enum([
  "PRIMARY_PROOF",
  "COUNTER_ARGUMENT",
  "EXPLANATORY_ATHAR",
  "REVEALED_STEP",
  "SCHOLARLY_EXPLANATION",
]);

export const BilingualTextSchema = z.object({
  fr: z.string().min(1, "Texte français requis"),
  ar: z.string().min(1, "Texte arabe requis"),
});

// Affirmation doctrinale/historique exigeant au minimum 1 preuve
export const TraceableClaimSchema = z.object({
  fr: z.string().min(1, "Texte français requis"),
  ar: z.string().min(1, "Texte arabe requis"),
  evidenceIds: z.array(z.string()).min(1, "Au moins une preuve doit être rattachée à cette affirmation"),
});

// Observation méthodologique (analyse critique où la preuve historique est facultative)
export const PedagogicalObservationSchema = z.object({
  fr: z.string().min(1, "Texte français requis"),
  ar: z.string().min(1, "Texte arabe requis"),
  evidenceIds: z.array(z.string()).default([]),
});

export const InquiryStepOptionSchema = z.object({
  textFr: z.string().min(1),
  textAr: z.string().optional(),
  isCorrect: z.boolean(),
  feedbackFr: z.string().min(1),
  feedbackAr: z.string().optional(),
});

export const InquiryStepSchema = z.object({
  stepNumber: z.number().int().positive(),
  titleFr: z.string().min(1),
  titleAr: z.string().optional(),
  instructionFr: z.string().min(1),
  instructionAr: z.string().optional(),
  options: z.array(InquiryStepOptionSchema).min(2, "Au moins 2 options par étape"),
  revealedEvidenceIds: z.array(z.string()).default([]),
});

export const InquiryEvidenceSchema = z.object({
  evidenceId: z.string().min(1, "L'ID de la preuve est requis"),
  role: EvidenceRoleEnum.default("PRIMARY_PROOF"),
  order: z.number().int().default(1),
  stepNumber: z.number().int().optional(),
  commentFr: z.string().optional(),
  commentAr: z.string().optional(),
  evidence: EvidenceSchema,
});

export const StandardConclusionSheetSchema = z.object({
  established: TraceableClaimSchema,
  discussed: TraceableClaimSchema,
  notEstablished: TraceableClaimSchema,
  primaryEvidences: z.array(z.string()).min(1, "Au moins une preuve principale est requise"),
  salafUnderstanding: TraceableClaimSchema,
  scholarlyPositions: TraceableClaimSchema,
  methodologicalPitfall: PedagogicalObservationSchema, // Preuve facultative pour observation pédagogique
  originalSources: z.array(z.string()).min(1, "Au moins une source originale est requise"),
  certaintyLevel: CertaintyLevelEnum,
});

export const InquirySchema = z
  .object({
    id: z.string().min(1, "L'id d'enquête est requis"),
    slug: z.string().min(1, "Le slug est requis"),
    domain: SchoolTypeEnum,
    editorialStatus: EditorialStatusEnum.default("DRAFT"),
    title: BilingualTextSchema,
    initialClaim: BilingualTextSchema,
    steps: z.array(InquiryStepSchema).min(1, "Au moins une étape d'enquête est requise"),
    conclusionSheet: StandardConclusionSheetSchema,
    inquiryEvidences: z.array(InquiryEvidenceSchema).min(1, "Au moins une preuve rattachée à l'enquête"),
    authorId: z.string().default("author-01"),
    reviewerId: z.string().optional(),
    reviewedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date YYYY-MM-DD").optional(),
    lastVerifiedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date YYYY-MM-DD").optional(),
  })
  .refine(
    (inquiry) => {
      if (inquiry.editorialStatus === "PUBLISHED") {
        if (!inquiry.reviewerId || !inquiry.reviewedAt) {
          return false;
        }
        // Vérifier qu'aucune preuve liée n'est encore TO_BE_CHECKED
        for (const ie of inquiry.inquiryEvidences) {
          if (ie.evidence && ie.evidence.citationStatus === "TO_BE_CHECKED") {
            return false;
          }
        }
      }
      return true;
    },
    {
      message:
        "Une enquête au statut PUBLISHED exige obligatoirement un reviewerId, un reviewedAt et aucune preuve avec le statut TO_BE_CHECKED.",
      path: ["editorialStatus"],
    }
  );

export type InquiryInput = z.infer<typeof InquirySchema>;
