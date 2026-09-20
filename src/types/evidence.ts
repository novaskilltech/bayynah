import { CitationStatus, TranslationStatus } from "./index";

export type EvidenceType =
  | "QURAN"
  | "HADITH"
  | "ATHAR"
  | "BOOK"
  | "SCHOLAR"
  | "CONTEMPORARY";

export interface EvidenceItem {
  id: string;
  type: EvidenceType;
  referenceCode: string; // Ex: "Ṣaḥîḥ Muslim 360"
  primarySource: boolean;
  
  // Rigueur philologique
  quoteArOriginal: string;
  quoteArVocalized?: string;
  quoteArNormalized?: string;
  translationFr: string;
  translator?: string;
  translationStatus: TranslationStatus;
  citationStatus: CitationStatus;
  
  sourceWork: string;
  author: string;
  editionVolumePage: string;
  authenticityGrade?: string;
  gradeScholar?: string;
  consultationUrl?: string;
}
