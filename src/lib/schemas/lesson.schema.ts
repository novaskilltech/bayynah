import { z } from "zod";
import { CitationStatusEnum } from "./evidence.schema";

export const SchoolTypeEnum = z.enum([
  "HADITH",
  "FIQH",
  "AQIDA",
  "CRITIQUE",
]);

export const EditorialStatusEnum = z.enum([
  "DRAFT",
  "IN_REVIEW",
  "APPROVED",
  "PUBLISHED",
  "ARCHIVED",
]);

export const HistoricReferenceSchema = z
  .object({
    author: z.string().min(1, "L'auteur est requis"),
    work: z.string().min(1, "L'ouvrage est requis"),
    editionVolumePage: z.string().min(1, "Le tome/page ou numéro de hadith est requis"),
    quoteArOriginal: z.string().min(1, "La citation arabe originale est requise"),
    quoteArVocalized: z.string().optional(),
    quoteArNormalized: z.string().optional(),
    translationFr: z.string().min(1, "La traduction française est requise"),
    translator: z.string().optional(),
    citationStatus: CitationStatusEnum.default("TO_BE_CHECKED"),
    verifiedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date YYYY-MM-DD").optional(),
    verifiedBy: z.string().optional(),
  })
  .refine(
    (ref) => {
      if (ref.citationStatus === "VERIFIED_VERBATIM") {
        return !!ref.verifiedAt && !!ref.verifiedBy;
      }
      return true;
    },
    {
      message: "Une référence historique VERIFIED_VERBATIM exige obligatoirement verifiedAt et verifiedBy.",
      path: ["citationStatus"],
    }
  );

export const QuizOptionSchema = z.object({
  textFr: z.string().min(1),
  textAr: z.string().optional(),
  isCorrect: z.boolean(),
  feedbackFr: z.string().min(1),
  feedbackAr: z.string().optional(),
});

export const QuizItemSchema = z.object({
  id: z.string().min(1),
  questionFr: z.string().min(1),
  questionAr: z.string().optional(),
  options: z.array(QuizOptionSchema).min(2, "Au moins deux options sont requises"),
  order: z.number().int().default(1),
});

export const LessonFrontmatterSchema = z
  .object({
    id: z.string().min(1, "L'id de la leçon est obligatoire"),
    slug: z.string().min(1, "Le slug est obligatoire"),
    school: SchoolTypeEnum,
    level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
    order: z.number().int().positive(),
    editorialStatus: EditorialStatusEnum.default("DRAFT"),
    titleFr: z.string().min(1, "Le titre français est obligatoire"),
    titleAr: z.string().min(1, "Le titre arabe est obligatoire"),
    summaryFr: z.string().min(1, "Le résumé français est obligatoire"),
    summaryAr: z.string().min(1, "Le résumé arabe est obligatoire"),
    methodologyPrincipleFr: z.string().min(1, "Le principe méthodologique en français est obligatoire"),
    methodologyPrincipleAr: z.string().min(1, "Le principe méthodologique en arabe est obligatoire"),
    historicReference: HistoricReferenceSchema.optional(),
    authorId: z.string().min(1, "L'identifiant de l'auteur est obligatoire"),
    reviewerId: z.string().optional(),
    reviewedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date YYYY-MM-DD").optional(),
    lastVerifiedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date YYYY-MM-DD").optional(),
    quizzes: z.array(QuizItemSchema).optional().default([]),
  })
  .refine(
    (lesson) => {
      if (lesson.editorialStatus === "PUBLISHED") {
        return !!lesson.reviewerId && !!lesson.reviewedAt;
      }
      return true;
    },
    {
      message: "Une leçon au statut PUBLISHED exige obligatoirement un reviewerId et un reviewedAt.",
      path: ["editorialStatus"],
    }
  );

export type LessonFrontmatter = z.infer<typeof LessonFrontmatterSchema>;
