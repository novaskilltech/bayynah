import { CitationStatus, TranslationStatus } from "./index";

export type EvidenceType =
  | "QURAN"
  | "HADITH"
  | "ATHAR"
  | "BOOK"
  | "CONTEMPORARY";

export interface BaseEvidenceItem {
  id: string;
  type: EvidenceType;
  referenceCode: string;
  primarySource: boolean; // Obligatoire
  quoteArOriginal: string;
  quoteArVocalized?: string;
  quoteArNormalized?: string;
  translationFr: string;
  translator?: string;
  translationStatus: TranslationStatus;
  citationStatus: CitationStatus;
  verifiedAt?: string;
  verifiedBy?: string;
  consultationUrl?: string;
  lastVerifiedAt?: string;
}

export interface QuranEvidenceItem extends BaseEvidenceItem {
  type: "QURAN";
  surahNumber: number;
  ayahNumber: number;
  surahNameAr: string;
  surahNameFr: string;
}

export interface HadithEvidenceItem extends BaseEvidenceItem {
  type: "HADITH";
  collection: string;
  author: string;
  hadithNumber: string;
  numberingSystem: string; // Système de numérotation obligatoire
  chapterAr?: string;
  chapterFr?: string;
  editionVolumePage: string;
  authenticityGrade: string;
  gradeScholar: string;
}

export interface AtharEvidenceItem extends BaseEvidenceItem {
  type: "ATHAR";
  narrator: string;
  sourceWork: string;
  author: string;
  editionVolumePage: string;
  authenticityGrade?: string;
  gradeScholar?: string;
}

export interface BookEvidenceItem extends BaseEvidenceItem {
  type: "BOOK";
  sourceWork: string;
  author: string;
  editionVolumePage: string;
}

export interface ContemporaryEvidenceItem extends BaseEvidenceItem {
  type: "CONTEMPORARY";
  sourceWork: string;
  author: string;
  consultationDate: string;
}

export type EvidenceItem =
  | QuranEvidenceItem
  | HadithEvidenceItem
  | AtharEvidenceItem
  | BookEvidenceItem
  | ContemporaryEvidenceItem;
