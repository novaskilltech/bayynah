import { z } from "zod";

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

// Base commune à toutes les preuves
const BaseEvidenceSchema = z.object({
  id: z.string().min(1, "L'identifiant de preuve est requis"),
  referenceCode: z.string().min(1, "Le code de référence est requis"),
  primarySource: z.boolean().default(false), // Non primaire par défaut
  quoteArOriginal: z.string().min(1, "La citation arabe originale (telle qu'éditée) est obligatoire"),
  quoteArVocalized: z.string().optional(),
  quoteArNormalized: z.string().optional(),
  translationFr: z.string().min(1, "La traduction française est obligatoire"),
  translator: z.string().optional(),
  translationStatus: TranslationStatusEnum.default("TRANSLATION_PROPOSED"),
  citationStatus: CitationStatusEnum.default("TO_BE_CHECKED"), // Non vérifié par défaut
  consultationUrl: z.string().url("L'URL de consultation doit être valide").optional().or(z.literal("")),
  lastVerifiedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date YYYY-MM-DD").optional(),
});

// 1. Preuve Coranique
export const QuranEvidenceSchema = BaseEvidenceSchema.extend({
  type: z.literal("QURAN"),
  surahNumber: z.number().int().min(1).max(114, "Le numéro de sourate doit être entre 1 et 114"),
  ayahNumber: z.number().int().min(1, "Le numéro de verset doit être positif"),
  surahNameAr: z.string().min(1, "Le nom arabe de la sourate est obligatoire"),
  surahNameFr: z.string().min(1, "Le nom français de la sourate est obligatoire"),
});

// 2. Preuve Hadith
export const HadithEvidenceSchema = BaseEvidenceSchema.extend({
  type: z.literal("HADITH"),
  collection: z.string().min(1, "Le recueil de hadith est obligatoire (ex: Ṣaḥîḥ Muslim)"),
  author: z.string().min(1, "L'auteur/compilateur du recueil est obligatoire"),
  hadithNumber: z.string().min(1, "Le numéro de hadith est obligatoire"),
  chapterAr: z.string().optional(),
  chapterFr: z.string().optional(),
  editionVolumePage: z.string().min(1, "La localisation précise (tome, page ou édition) est obligatoire"),
  authenticityGrade: z.string().min(1, "Le degré d'authenticité est obligatoire (ex: Ṣaḥîḥ, Ḥasan, Ḍaʿîf)"),
  gradeScholar: z.string().min(1, "Le savant ayant émis le jugement d'authenticité est obligatoire"),
});

// 3. Preuve Athar (Compagnon ou Tâbi'î)
export const AtharEvidenceSchema = BaseEvidenceSchema.extend({
  type: z.literal("ATHAR"),
  narrator: z.string().min(1, "Le nom du Compagnon ou Tâbi'î rapporteur est obligatoire"),
  sourceWork: z.string().min(1, "L'ouvrage source est obligatoire (ex: Musannaf Ibn Abi Shayba)"),
  author: z.string().min(1, "L'auteur de l'ouvrage est obligatoire"),
  editionVolumePage: z.string().min(1, "La localisation précise (tome, page) est obligatoire"),
  authenticityGrade: z.string().optional(),
  gradeScholar: z.string().optional(),
});

// 4. Preuve Ouvrage / Avis savant classique
export const BookEvidenceSchema = BaseEvidenceSchema.extend({
  type: z.literal("BOOK"),
  sourceWork: z.string().min(1, "Le titre de l'ouvrage est obligatoire"),
  author: z.string().min(1, "L'auteur est obligatoire"),
  editionVolumePage: z.string().min(1, "La localisation précise (tome, page) est obligatoire"),
});

// 5. Source Contemporaine
export const ContemporaryEvidenceSchema = BaseEvidenceSchema.extend({
  type: z.literal("CONTEMPORARY"),
  sourceWork: z.string().min(1, "La source contemporaine est obligatoire"),
  author: z.string().min(1, "L'auteur est obligatoire"),
  consultationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date YYYY-MM-DD requis"),
});

// Union discriminée stricte
export const EvidenceSchema = z.discriminatedUnion("type", [
  QuranEvidenceSchema,
  HadithEvidenceSchema,
  AtharEvidenceSchema,
  BookEvidenceSchema,
  ContemporaryEvidenceSchema,
]);

export type EvidenceInput = z.infer<typeof EvidenceSchema>;
export type QuranEvidenceInput = z.infer<typeof QuranEvidenceSchema>;
export type HadithEvidenceInput = z.infer<typeof HadithEvidenceSchema>;
export type AtharEvidenceInput = z.infer<typeof AtharEvidenceSchema>;
export type BookEvidenceInput = z.infer<typeof BookEvidenceSchema>;
export type ContemporaryEvidenceInput = z.infer<typeof ContemporaryEvidenceSchema>;
