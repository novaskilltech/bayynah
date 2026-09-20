export type Locale = "fr" | "ar";

export type Role = "USER" | "STUDENT" | "AUTHOR" | "REVIEWER" | "ADMIN";

export type SchoolType = "HADITH" | "FIQH" | "AQIDA" | "CRITIQUE";

export type CertaintyLevel =
  | "ETABLI"
  | "FORTEMENT_ETABLI"
  | "KHILAF_RECONNU"
  | "EXPERTISE_REQUISE"
  | "INSUFFISANT";

export interface BilingualText {
  fr: string;
  ar: string;
}

export interface HistoricReference {
  author: string;
  work: string;
  quoteAr?: string;
  quoteFr?: string;
}
