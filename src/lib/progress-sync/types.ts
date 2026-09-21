import { SkillId, UserLearningProfile, AttestationData } from "@/types/skills";

export interface SkillAttemptInput {
  id: string; // UUID v4 généré par le client (idempotence)
  skillId: SkillId;
  contextId: string; // Ex: "lesson-01", "inquiry-03", "diagnostic", "final-eval"
  contextType: "LESSON" | "INQUIRY" | "DIAGNOSTIC" | "FINAL_ASSESSMENT";
  score: number; // 0.0 à 1.0
  weight?: number; // Défaut 1.0
  metadata?: Record<string, unknown>;
  clientTimestamp: string; // ISO 8601
}

export interface DiagnosticAttemptInput {
  id: string; // UUID v4
  scorePercent: number;
  answers: Record<string, string>;
  rulesVersion?: string;
  clientTimestamp: string;
}

export interface FinalAssessmentAttemptInput {
  id: string; // UUID v4
  scorePercent: number;
  answers: Record<string, string>;
  rulesVersion?: string;
  clientTimestamp: string;
}

export interface SyncPayload {
  skillAttempts: SkillAttemptInput[];
  diagnosticAttempts?: DiagnosticAttemptInput[];
  finalAssessmentAttempts?: FinalAssessmentAttemptInput[];
  completedContentIds?: string[];
}

export interface SyncResult {
  success: boolean;
  syncedAttemptsCount: number;
  ignoredDuplicatesCount: number;
  recalculatedProfile: UserLearningProfile;
  attestations: AttestationData[];
  syncTimestamp: string;
}

export interface ExportedUserData {
  account: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    createdAt: string;
  };
  learningProfile: UserLearningProfile | null;
  skillAttempts: SkillAttemptInput[];
  diagnosticAttempts: DiagnosticAttemptInput[];
  finalAssessmentAttempts: FinalAssessmentAttemptInput[];
  attestations: AttestationData[];
  exportTimestamp: string;
  privacyNotice: string;
}
