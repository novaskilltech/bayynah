import { z } from "zod";
import { prisma } from "@/lib/prisma";

// =========================================================================
// Schémas de métadonnées strictement typés (ZÉRO texte libre, ZÉRO PII)
// =========================================================================

const DiagnosticStartedMetadataSchema = z
  .object({
    questionCount: z.number().int().min(1).max(50).optional(),
  })
  .strict();

const DiagnosticCompletedMetadataSchema = z
  .object({
    totalQuestions: z.number().int().min(1).max(50),
    correctAnswers: z.number().int().min(0).max(50),
    initialScorePercent: z.number().min(0).max(100),
  })
  .strict();

const LessonOpenedMetadataSchema = z
  .object({
    school: z.string().max(32).optional(),
    level: z.number().int().min(1).max(5).optional(),
  })
  .strict();

const LessonCompletedMetadataSchema = z
  .object({
    quizScorePercent: z.number().min(0).max(100),
    passed: z.boolean(),
  })
  .strict();

const InquiryStartedMetadataSchema = z
  .object({
    certaintyLevelTarget: z.string().max(32).optional(),
  })
  .strict();

const InquiryStepAnsweredMetadataSchema = z
  .object({
    quality: z.enum(["INCORRECT", "PREMATURE", "ACCEPTABLE", "BEST"]),
    methodologicalScore: z.number().int().min(0).max(3),
    attemptNumber: z.number().int().min(1).max(10),
  })
  .strict();

const InquiryAbandonedMetadataSchema = z
  .object({
    lastCompletedStep: z.number().int().min(0).max(50).optional(),
  })
  .strict();

const InquiryCompletedMetadataSchema = z
  .object({
    finalQuality: z.enum(["INCORRECT", "PREMATURE", "ACCEPTABLE", "BEST"]),
    totalMethodologicalScore: z.number().int().min(0).max(100),
    stepsCount: z.number().int().min(1).max(50),
  })
  .strict();

const FinalAssessmentStartedMetadataSchema = z
  .object({
    totalQuestions: z.number().int().min(1).max(50).optional(),
  })
  .strict();

const FinalAssessmentCompletedMetadataSchema = z
  .object({
    finalScorePercent: z.number().min(0).max(100),
    eligibleForAttestation: z.boolean(),
    attestationType: z.enum(["PARCOURS", "MAITRISE_METHODOLOGIQUE", "NONE"]).optional(),
  })
  .strict();

const GlossaryOpenedMetadataSchema = z
  .object({
    termId: z.string().max(64),
    fromResource: z.string().max(128).optional(),
  })
  .strict();

// =========================================================================
// Événements discriminés par eventType (Discriminated Union)
// =========================================================================

const BaseEventFields = {
  pilotSessionId: z.string().min(8).max(64),
  pilotSessionSignature: z.string().length(64),
  expiresAt: z.number().int().positive(),
  resourceType: z.enum(["lesson", "inquiry", "diagnostic", "final_assessment", "glossary"]).optional(),
  resourceId: z.string().max(128).optional(),
  stepNumber: z.number().int().min(0).max(100).optional(),
  durationMs: z.number().int().min(0).max(24 * 60 * 60 * 1000).optional(),
};

export const TelemetryEventSchema = z.discriminatedUnion("eventType", [
  z.object({
    ...BaseEventFields,
    eventType: z.literal("DIAGNOSTIC_STARTED"),
    metadata: DiagnosticStartedMetadataSchema.optional(),
  }),
  z.object({
    ...BaseEventFields,
    eventType: z.literal("DIAGNOSTIC_COMPLETED"),
    metadata: DiagnosticCompletedMetadataSchema,
  }),
  z.object({
    ...BaseEventFields,
    eventType: z.literal("LESSON_OPENED"),
    metadata: LessonOpenedMetadataSchema.optional(),
  }),
  z.object({
    ...BaseEventFields,
    eventType: z.literal("LESSON_COMPLETED"),
    metadata: LessonCompletedMetadataSchema,
  }),
  z.object({
    ...BaseEventFields,
    eventType: z.literal("INQUIRY_STARTED"),
    metadata: InquiryStartedMetadataSchema.optional(),
  }),
  z.object({
    ...BaseEventFields,
    eventType: z.literal("INQUIRY_STEP_ANSWERED"),
    metadata: InquiryStepAnsweredMetadataSchema,
  }),
  z.object({
    ...BaseEventFields,
    eventType: z.literal("INQUIRY_ABANDONED"),
    metadata: InquiryAbandonedMetadataSchema.optional(),
  }),
  z.object({
    ...BaseEventFields,
    eventType: z.literal("INQUIRY_COMPLETED"),
    metadata: InquiryCompletedMetadataSchema,
  }),
  z.object({
    ...BaseEventFields,
    eventType: z.literal("FINAL_ASSESSMENT_STARTED"),
    metadata: FinalAssessmentStartedMetadataSchema.optional(),
  }),
  z.object({
    ...BaseEventFields,
    eventType: z.literal("FINAL_ASSESSMENT_COMPLETED"),
    metadata: FinalAssessmentCompletedMetadataSchema,
  }),
  z.object({
    ...BaseEventFields,
    eventType: z.literal("GLOSSARY_OPENED"),
    metadata: GlossaryOpenedMetadataSchema.optional(),
  }),
]);

export type TelemetryEvent = z.infer<typeof TelemetryEventSchema>;

/**
 * Purge des métriques de télémétrie pédagogique brutes au-delà du seuil de rétention (90 jours).
 */
export async function purgeOldPedagogicalMetrics(days = 90): Promise<number> {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const result = await prisma.pedagogicalMetric.deleteMany({
    where: {
      createdAt: {
        lt: cutoff,
      },
    },
  });
  return result.count;
}
