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

export const StepOptionQualityEnum = z.enum([
  "INCORRECT",
  "PREMATURE",
  "ACCEPTABLE",
  "BEST",
]);

export const RevealPolicyEnum = z.enum([
  "ON_STEP_ENTER",
  "AFTER_ANSWER",
  "AFTER_BEST_ANSWER",
  "NEXT_STEP",
]);

export const InquiryStepOptionSchema = z
  .object({
    textFr: z.string().min(1),
    textAr: z.string().optional(),
    quality: StepOptionQualityEnum,
    methodologicalScore: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
    feedbackFr: z.string().min(1),
    feedbackAr: z.string().optional(),
  })
  .superRefine((opt, ctx) => {
    const expectedScoreMap: Record<z.infer<typeof StepOptionQualityEnum>, number> = {
      INCORRECT: 0,
      PREMATURE: 1,
      ACCEPTABLE: 2,
      BEST: 3,
    };
    if (opt.methodologicalScore !== expectedScoreMap[opt.quality]) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Incohérence score/qualité : pour la qualité "${opt.quality}", le score attendu est ${expectedScoreMap[opt.quality]}, mais ${opt.methodologicalScore} a été fourni.`,
        path: ["methodologicalScore"],
      });
    }
  });

export const InquiryStepSchema = z
  .object({
    stepNumber: z.number().int().positive(),
    titleFr: z.string().min(1),
    titleAr: z.string().optional(),
    instructionFr: z.string().min(1),
    instructionAr: z.string().optional(),
    options: z.array(InquiryStepOptionSchema).min(2, "Au moins 2 options par étape"),
    revealedEvidenceIds: z.array(z.string()).default([]),
    revealPolicy: RevealPolicyEnum.default("AFTER_ANSWER"),
  })
  .superRefine((step, ctx) => {
    const bestCount = step.options.filter((o) => o.quality === "BEST").length;
    if (bestCount !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Chaque étape doit comporter exactement une seule option avec la qualité "BEST" (trouvé : ${bestCount}).`,
        path: ["options"],
      });
    }
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
  .superRefine((inquiry, ctx) => {
    if (inquiry.editorialStatus === "PUBLISHED") {
      if (!inquiry.reviewerId || !inquiry.reviewedAt) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Une enquête au statut PUBLISHED exige obligatoirement un reviewerId et un reviewedAt.",
          path: ["editorialStatus"],
        });
      }

      // Vérifier qu'aucune preuve liée n'est encore TO_BE_CHECKED
      for (let i = 0; i < inquiry.inquiryEvidences.length; i++) {
        const ie = inquiry.inquiryEvidences[i];
        if (ie.evidence && ie.evidence.citationStatus === "TO_BE_CHECKED") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `La preuve "${ie.evidenceId}" a le statut TO_BE_CHECKED, interdit pour une enquête PUBLISHED.`,
            path: ["inquiryEvidences", i, "evidence", "citationStatus"],
          });
        }
      }

      // Exiger exactement 10 étapes pour une enquête PUBLISHED
      if (inquiry.steps.length !== 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Une enquête PUBLISHED doit comporter exactement 10 étapes (trouvé : ${inquiry.steps.length}).`,
          path: ["steps"],
        });
      }

      // Vérifier la numérotation séquentielle 1 à 10 sans doublon
      const stepNumbers = inquiry.steps.map((s) => s.stepNumber);
      const isSequential =
        stepNumbers.length === 10 &&
        stepNumbers.every((num, idx) => num === idx + 1);

      if (!isSequential) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Les 10 étapes d'une enquête PUBLISHED doivent être numérotées séquentiellement de 1 à 10 sans doublon ni saut (trouvé : [${stepNumbers.join(", ")}]).`,
          path: ["steps"],
        });
      }
    }
  });

export type InquiryInput = z.infer<typeof InquirySchema>;
