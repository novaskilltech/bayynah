import { z } from "zod";

export const MethodologicalSkillEnum = z.enum([
  "SOURCE_IDENTIFICATION",
  "PRIMARY_SOURCE_RETRIEVAL",
  "AUTHENTICITY_CHECK",
  "CONTEXT_ANALYSIS",
  "TEXT_MEANING",
  "EVIDENCE_AGGREGATION",
  "DALALA_ANALYSIS",
  "KHILAF_IDENTIFICATION",
  "SALAF_ATTRIBUTION",
  "IJMA_VERIFICATION",
  "EPISTEMIC_CAUTION",
  "CONCLUSION_CALIBRATION",
  "BIAS_DETECTION",
  "TERMINOLOGY_ANALYSIS",
]);

export const BilingualTextSchema = z.object({
  fr: z.string().min(1, "Le texte français est requis"),
  ar: z.string().min(1, "Le texte arabe est requis"),
});

export const DiagnosticOptionSchema = z.object({
  id: z.string().min(1),
  text: BilingualTextSchema,
  quality: z.enum(["BEST", "ACCEPTABLE", "PREMATURE", "INCORRECT"]),
  methodologicalScore: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  feedback: BilingualTextSchema,
});

export const DiagnosticQuestionSchema = z
  .object({
    id: z.string().min(1),
    order: z.number().int().positive(),
    title: BilingualTextSchema,
    situation: BilingualTextSchema,
    primarySkill: MethodologicalSkillEnum,
    secondarySkills: z.array(MethodologicalSkillEnum).optional(),
    options: z.array(DiagnosticOptionSchema).length(4, "Chaque question doit comporter exactement 4 options"),
  })
  .refine(
    (q) => {
      const bestCount = q.options.filter((o) => o.quality === "BEST").length;
      return bestCount === 1;
    },
    {
      message: "Chaque question doit comporter exactement une option avec la qualité BEST.",
      path: ["options"],
    }
  );

export const FinalAssessmentScenarioSchema = z
  .object({
    id: z.string().min(1),
    order: z.number().int().positive(),
    title: BilingualTextSchema,
    contextDescription: BilingualTextSchema,
    claim: BilingualTextSchema,
    primarySkill: MethodologicalSkillEnum,
    options: z.array(DiagnosticOptionSchema).length(4, "Chaque scénario doit comporter exactement 4 options"),
  })
  .refine(
    (s) => {
      const bestCount = s.options.filter((o) => o.quality === "BEST").length;
      return bestCount === 1;
    },
    {
      message: "Chaque scénario doit comporter exactement une option avec la qualité BEST.",
      path: ["options"],
    }
  );
