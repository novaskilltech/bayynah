export type Locale = "fr" | "ar";

export type Role = "USER" | "REVIEWER" | "ADMIN";

export type SchoolType = "HADITH" | "FIQH" | "AQIDA" | "CRITIQUE";

export type CertaintyLevel =
  | "ETABLI"
  | "FORTEMENT_ETABLI"
  | "KHILAF_RECONNU"
  | "EXPERTISE_REQUISE"
  | "INSUFFISANT";

export type EditorialStatus =
  | "DRAFT"
  | "IN_REVIEW"
  | "APPROVED"
  | "PUBLISHED"
  | "ARCHIVED";

export type CitationStatus =
  | "VERIFIED_VERBATIM"
  | "VERIFIED_PARAPHRASE"
  | "TO_BE_CHECKED";

export type TranslationStatus =
  | "TRANSLATION_OFFICIAL"
  | "TRANSLATION_PROPOSED"
  | "TRANSLATION_REVISED";

export type EvidenceRole =
  | "PRIMARY_PROOF"
  | "COUNTER_ARGUMENT"
  | "EXPLANATORY_ATHAR"
  | "REVEALED_STEP"
  | "SCHOLARLY_EXPLANATION";

export interface BilingualText {
  fr: string;
  ar: string;
}

export interface HistoricReference {
  author: string;
  work: string;
  editionVolumePage: string;
  quoteArOriginal: string;
  quoteArVocalized?: string;
  quoteArNormalized?: string;
  translationFr: string;
  translator?: string;
  citationStatus: CitationStatus;
  verifiedAt?: string;
  verifiedBy?: string;
}
