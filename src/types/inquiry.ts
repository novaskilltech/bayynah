import { BilingualText, CertaintyLevel, EvidenceRole, SchoolType } from "./index";
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

export interface InquiryEvidenceItem {
  evidenceId: string;
  role: EvidenceRole;
  order: number;
  stepNumber?: number;
  commentFr?: string;
  commentAr?: string;
  evidence?: EvidenceItem;
}

// Affirmation scientifique traçable pointant vers des preuves
export interface TraceableClaim {
  fr: string;
  ar: string;
  evidenceIds: string[];
}

export interface StandardConclusionSheet {
  established: TraceableClaim;
  discussed: TraceableClaim;
  notEstablished: TraceableClaim;
  primaryEvidences: string[];
  salafUnderstanding: TraceableClaim;
  scholarlyPositions: TraceableClaim;
  methodologicalPitfall: TraceableClaim;
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
  inquiryEvidences: InquiryEvidenceItem[];
  authorId: string;
  reviewerId?: string;
  lastVerifiedAt?: string;
}
