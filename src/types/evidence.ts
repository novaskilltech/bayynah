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
  referenceCode: string;
  textAr: string;
  translationFr: string;
  sourceWork: string;
  author: string;
  editionVolumePage?: string;
  authenticityGrade?: string;
  gradeSource?: string;
  verifiedUrl?: string;
}
