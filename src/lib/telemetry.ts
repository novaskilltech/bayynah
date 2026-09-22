import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  CANONICAL_CERTAINTY_LEVELS,
  CANONICAL_SCHOOLS,
  VALID_GLOSSARY_TERM_IDS,
  VALID_INQUIRY_IDS_AND_SLUGS,
  VALID_LESSON_SLUGS,
} from "@/lib/telemetry-contract";

export {
  CANONICAL_CERTAINTY_LEVELS,
  CANONICAL_SCHOOLS,
  VALID_GLOSSARY_TERM_IDS,
  VALID_INQUIRY_IDS_AND_SLUGS,
  VALID_LESSON_SLUGS,
} from "@/lib/telemetry-contract";

// =========================================================================
// Listes fermées canoniques de slugs et identifiants (ZÉRO chaîne libre)
// =========================================================================

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
    school: z.enum(CANONICAL_SCHOOLS).optional(),
    level: z.number().int().min(1).max(4).optional(),
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
    certaintyLevelTarget: z.enum(CANONICAL_CERTAINTY_LEVELS).optional(),
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
    lastCompletedStep: z.number().int().min(1).max(50).optional(),
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

// Union canonique fermée de tous les identifiants de ressources valides pour fromResourceId
const VALID_FROM_RESOURCE_IDS = [
  ...VALID_LESSON_SLUGS,
  ...VALID_INQUIRY_IDS_AND_SLUGS,
  "diagnostic-initial",
  "evaluation-finale",
] as const;

const GlossaryOpenedMetadataSchema = z
  .object({
    termId: z.enum(VALID_GLOSSARY_TERM_IDS),
    fromResourceType: z.enum(["lesson", "inquiry", "diagnostic", "final_assessment"]).optional(),
    fromResourceId: z.enum(VALID_FROM_RESOURCE_IDS).optional(),
  })
  .strict();

// =========================================================================
// Événements discriminés par eventType avec validation stricte de resourceId
// =========================================================================

const BaseSecurityFields = {
  pilotSessionId: z.string().regex(/^pilot_[0-9a-f]{32}$/),
  pilotSessionSignature: z.string().regex(/^[0-9a-f]{64}$/),
  expiresAt: z.number().int().positive(),
  stepNumber: z.number().int().min(0).max(100).optional(),
  durationMs: z.number().int().min(0).max(24 * 60 * 60 * 1000).optional(),
};

export const TelemetryEventSchema = z.discriminatedUnion("eventType", [
  // 1. Diagnostic
  z.object({
    ...BaseSecurityFields,
    eventType: z.literal("DIAGNOSTIC_STARTED"),
    resourceType: z.literal("diagnostic"),
    resourceId: z.literal("diagnostic-initial"),
    metadata: DiagnosticStartedMetadataSchema.optional(),
  }).strict(),
  z.object({
    ...BaseSecurityFields,
    eventType: z.literal("DIAGNOSTIC_COMPLETED"),
    resourceType: z.literal("diagnostic"),
    resourceId: z.literal("diagnostic-initial"),
    metadata: DiagnosticCompletedMetadataSchema,
  }).strict(),

  // 2. Leçon
  z.object({
    ...BaseSecurityFields,
    eventType: z.literal("LESSON_OPENED"),
    resourceType: z.literal("lesson"),
    resourceId: z.enum(VALID_LESSON_SLUGS),
    metadata: LessonOpenedMetadataSchema.optional(),
  }).strict(),
  z.object({
    ...BaseSecurityFields,
    eventType: z.literal("LESSON_COMPLETED"),
    resourceType: z.literal("lesson"),
    resourceId: z.enum(VALID_LESSON_SLUGS),
    metadata: LessonCompletedMetadataSchema,
  }).strict(),

  // 3. Enquête
  z.object({
    ...BaseSecurityFields,
    eventType: z.literal("INQUIRY_STARTED"),
    resourceType: z.literal("inquiry"),
    resourceId: z.enum(VALID_INQUIRY_IDS_AND_SLUGS),
    metadata: InquiryStartedMetadataSchema.optional(),
  }).strict(),
  z.object({
    ...BaseSecurityFields,
    eventType: z.literal("INQUIRY_STEP_ANSWERED"),
    resourceType: z.literal("inquiry"),
    resourceId: z.enum(VALID_INQUIRY_IDS_AND_SLUGS),
    metadata: InquiryStepAnsweredMetadataSchema,
  }).strict(),
  z.object({
    ...BaseSecurityFields,
    eventType: z.literal("INQUIRY_ABANDONED"),
    resourceType: z.literal("inquiry"),
    resourceId: z.enum(VALID_INQUIRY_IDS_AND_SLUGS),
    metadata: InquiryAbandonedMetadataSchema.optional(),
  }).strict(),
  z.object({
    ...BaseSecurityFields,
    eventType: z.literal("INQUIRY_COMPLETED"),
    resourceType: z.literal("inquiry"),
    resourceId: z.enum(VALID_INQUIRY_IDS_AND_SLUGS),
    metadata: InquiryCompletedMetadataSchema,
  }).strict(),

  // 4. Évaluation Finale
  z.object({
    ...BaseSecurityFields,
    eventType: z.literal("FINAL_ASSESSMENT_STARTED"),
    resourceType: z.literal("final_assessment"),
    resourceId: z.literal("evaluation-finale"),
    metadata: FinalAssessmentStartedMetadataSchema.optional(),
  }).strict(),
  z.object({
    ...BaseSecurityFields,
    eventType: z.literal("FINAL_ASSESSMENT_COMPLETED"),
    resourceType: z.literal("final_assessment"),
    resourceId: z.literal("evaluation-finale"),
    metadata: FinalAssessmentCompletedMetadataSchema,
  }).strict(),

  // 5. Lexique
  z.object({
    ...BaseSecurityFields,
    eventType: z.literal("GLOSSARY_OPENED"),
    resourceType: z.literal("glossary"),
    resourceId: z.enum(VALID_GLOSSARY_TERM_IDS),
    metadata: GlossaryOpenedMetadataSchema.optional(),
  }).strict(),
]).superRefine((event, context) => {
  if (event.eventType !== "GLOSSARY_OPENED" || !event.metadata) return;

  if (event.metadata.termId !== event.resourceId) {
    context.addIssue({
      code: "custom",
      path: ["metadata", "termId"],
      message: "termId must match resourceId.",
    });
  }

  const { fromResourceType, fromResourceId } = event.metadata;
  if ((fromResourceType && !fromResourceId) || (!fromResourceType && fromResourceId)) {
    context.addIssue({
      code: "custom",
      path: ["metadata"],
      message: "fromResourceType and fromResourceId must be provided together.",
    });
    return;
  }

  if (!fromResourceType || !fromResourceId) return;
  const matchesType =
    (fromResourceType === "lesson" && (VALID_LESSON_SLUGS as readonly string[]).includes(fromResourceId)) ||
    (fromResourceType === "inquiry" && (VALID_INQUIRY_IDS_AND_SLUGS as readonly string[]).includes(fromResourceId)) ||
    (fromResourceType === "diagnostic" && fromResourceId === "diagnostic-initial") ||
    (fromResourceType === "final_assessment" && fromResourceId === "evaluation-finale");

  if (!matchesType) {
    context.addIssue({
      code: "custom",
      path: ["metadata", "fromResourceId"],
      message: "fromResourceId does not match fromResourceType.",
    });
  }
});

export type TelemetryEvent = z.infer<typeof TelemetryEventSchema>;

/**
 * Purge des métriques de télémétrie pédagogique brutes au-delà du seuil de rétention (90 jours).
 */
interface PedagogicalMetricRetentionStore {
  deleteMany(args: { where: { createdAt: { lt: Date } } }): Promise<{ count: number }>;
}

export async function purgeOldPedagogicalMetrics(
  days = 90,
  store: PedagogicalMetricRetentionStore = prisma.pedagogicalMetric,
  now = Date.now()
): Promise<number> {
  if (!Number.isInteger(days) || days < 1 || days > 3650) {
    throw new RangeError("Retention days must be an integer between 1 and 3650.");
  }
  const cutoff = new Date(now - days * 24 * 60 * 60 * 1000);
  const result = await store.deleteMany({
    where: {
      createdAt: {
        lt: cutoff,
      },
    },
  });
  return result.count;
}
