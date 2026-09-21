import { BilingualText, CertaintyLevel, EditorialStatus, EvidenceRole, SchoolType } from "./index";
import { EvidenceItem } from "./evidence";

export type StepOptionQuality = "INCORRECT" | "PREMATURE" | "ACCEPTABLE" | "BEST";
export type MethodologicalScore = 0 | 1 | 2 | 3;
export type RevealPolicy = "ON_STEP_ENTER" | "AFTER_ANSWER" | "AFTER_BEST_ANSWER" | "NEXT_STEP";

export interface InquiryStepOption {
  textFr: string;
  textAr?: string;
  quality: StepOptionQuality;
  methodologicalScore: MethodologicalScore;
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
  revealPolicy?: RevealPolicy;
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

// Fait historique ou doctrinal exigeant au moins une preuve
export interface TraceableClaim {
  fr: string;
  ar: string;
  evidenceIds: string[]; // min 1 requis
}

// Observation méthodologique (analyse pédagogique où la preuve est facultative)
export interface PedagogicalObservation {
  fr: string;
  ar: string;
  evidenceIds?: string[];
}

export interface StandardConclusionSheet {
  established: TraceableClaim;
  discussed: TraceableClaim;
  notEstablished: TraceableClaim;
  primaryEvidences: string[];
  salafUnderstanding: TraceableClaim;
  scholarlyPositions: TraceableClaim;
  methodologicalPitfall: PedagogicalObservation;
  originalSources: string[];
  certaintyLevel: CertaintyLevel;
}

export interface InquiryItem {
  id: string;
  slug: string;
  domain: SchoolType;
  editorialStatus: EditorialStatus;
  title: BilingualText;
  initialClaim: BilingualText;
  steps: InquiryStep[];
  conclusionSheet: StandardConclusionSheet;
  inquiryEvidences: InquiryEvidenceItem[];
  authorId: string;
  reviewerId?: string;
  reviewedAt?: string;
  lastVerifiedAt?: string;
}
