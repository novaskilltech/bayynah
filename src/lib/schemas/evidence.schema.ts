import { z } from "zod";

export const EvidenceTypeEnum = z.enum([
  "QURAN",
  "HADITH",
  "ATHAR",
  "BOOK",
  "SCHOLAR",
  "CONTEMPORARY",
]);

export const CitationStatusEnum = z.enum([
  "VERIFIED_VERBATIM",
  "VERIFIED_PARAPHRASE",
  "TO_BE_CHECKED",
]);

export const TranslationStatusEnum = z.enum([
  "TRANSLATION_OFFICIAL",
  "TRANSLATION_PROPOSED",
  "TRANSLATION_REVISED",
]);

export const EvidenceSchema = z.object({
  id: z.string().min(1, "L'identifiant de preuve est requis"),
  type: EvidenceTypeEnum,
  referenceCode: z.string().min(1, "Le code de référence est requis (ex: Sahih Muslim 360)"),
  primarySource: z.boolean().default(true),
  quoteArOriginal: z.string().min(1, "La citation arabe originale (telle qu'éditée) est obligatoire"),
  quoteArVocalized: z.string().optional(),
  quoteArNormalized: z.string().optional(),
  translationFr: z.string().min(1, "La traduction française est obligatoire"),
  translator: z.string().optional(),
  translationStatus: TranslationStatusEnum.default("TRANSLATION_PROPOSED"),
  citationStatus: CitationStatusEnum.default("VERIFIED_VERBATIM"),
  sourceWork: z.string().min(1, "L'ouvrage original est obligatoire"),
  author: z.string().min(1, "L'auteur de l'ouvrage est obligatoire"),
  editionVolumePage: z.string().min(1, "La localisation précise (tome, page ou numéro) est obligatoire"),
  authenticityGrade: z.string().optional(),
  gradeScholar: z.string().optional(),
  consultationUrl: z.string().url("L'URL de consultation doit être valide").optional().or(z.literal("")),
});

export type EvidenceInput = z.infer<typeof EvidenceSchema>;
