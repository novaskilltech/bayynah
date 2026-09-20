import { BilingualText, CertaintyLevel, SchoolType } from "./index";
import { EvidenceItem } from "./evidence";

export interface InquiryStepOption {
  textFr: string;
  textAr?: string;
  isCorrect: boolean;
  feedbackFr: string;
  feedbackAr?: string;
}

export interface InquiryStep {
  stepNumber: number;
  titleFr: string;
  titleAr?: string;
  instructionFr: string;
  instructionAr?: string;
  options: InquiryStepOption[];
  revealedEvidenceIds: string[];
}

export interface StandardConclusionSheet {
  established: BilingualText;
  discussed: BilingualText;
  notEstablished: BilingualText;
  primaryEvidences: string[]; // Références vers EvidenceItem
  salafUnderstanding: BilingualText;
  scholarlyPositions: BilingualText;
  methodologicalPitfall: BilingualText;
  originalSources: string[];
  certaintyLevel: CertaintyLevel;
}

export interface InquiryItem {
  id: string;
  slug: string;
  domain: SchoolType;
  title: BilingualText;
  initialClaim: BilingualText;
  steps: InquiryStep[];
  conclusionSheet: StandardConclusionSheet;
  evidenceReferences: EvidenceItem[];
  lastVerifiedAt: string;
}
