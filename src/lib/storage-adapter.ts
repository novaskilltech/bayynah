import {
  SkillAttempt,
  DiagnosticAttempt,
  FinalAssessmentAttempt,
  MethodologicalProfile,
} from "@/types/skills";
import { buildMethodologicalProfile, createInitialMethodologicalProfile } from "./skills-calculator";

export const STORAGE_KEYS = {
  SKILL_ATTEMPTS: "tabayyun_skill_attempts",
  DIAGNOSTIC_ATTEMPT: "tabayyun_diagnostic_attempt",
  FINAL_ASSESSMENT_ATTEMPT: "tabayyun_final_assessment_attempt",
  COMPLETED_LESSONS: "tabayyun_completed_lessons",
  COMPLETED_INQUIRIES: "tabayyun_completed_inquiries",
};

export const PROGRESS_UPDATED_EVENT = "tabayyun-progress-updated";

function notifyProgressUpdated(): void {
  if (isClient()) window.dispatchEvent(new Event(PROGRESS_UPDATED_EVENT));
}

/**
 * Accès sécurisé au localStorage pour le mode invité (client-side uniquement)
 */
function isClient(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function getSkillAttempts(): SkillAttempt[] {
  if (!isClient()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SKILL_ATTEMPTS);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Erreur de lecture des SkillAttempts:", err);
    return [];
  }
}

export function saveSkillAttempt(attempt: SkillAttempt): void {
  if (!isClient()) return;
  try {
    const current = getSkillAttempts();
    current.push(attempt);
    localStorage.setItem(STORAGE_KEYS.SKILL_ATTEMPTS, JSON.stringify(current));
    notifyProgressUpdated();
  } catch (err) {
    console.error("Erreur d'enregistrement de SkillAttempt:", err);
  }
}

export function getDiagnosticAttempt(): DiagnosticAttempt | null {
  if (!isClient()) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DIAGNOSTIC_ATTEMPT);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error("Erreur de lecture du DiagnosticAttempt:", err);
    return null;
  }
}

export function saveDiagnosticAttempt(attempt: DiagnosticAttempt): void {
  if (!isClient()) return;
  try {
    localStorage.setItem(STORAGE_KEYS.DIAGNOSTIC_ATTEMPT, JSON.stringify(attempt));
    notifyProgressUpdated();
  } catch (err) {
    console.error("Erreur d'enregistrement du DiagnosticAttempt:", err);
  }
}

export function getFinalAssessmentAttempt(): FinalAssessmentAttempt | null {
  if (!isClient()) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FINAL_ASSESSMENT_ATTEMPT);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error("Erreur de lecture du FinalAssessmentAttempt:", err);
    return null;
  }
}

export function saveFinalAssessmentAttempt(attempt: FinalAssessmentAttempt): void {
  if (!isClient()) return;
  try {
    localStorage.setItem(STORAGE_KEYS.FINAL_ASSESSMENT_ATTEMPT, JSON.stringify(attempt));
    notifyProgressUpdated();
  } catch (err) {
    console.error("Erreur d'enregistrement du FinalAssessmentAttempt:", err);
  }
}

export function getCompletedLessons(): string[] {
  if (!isClient()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COMPLETED_LESSONS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markLessonCompleted(lessonId: string): void {
  if (!isClient()) return;
  try {
    const current = getCompletedLessons();
    if (!current.includes(lessonId)) {
      current.push(lessonId);
      localStorage.setItem(STORAGE_KEYS.COMPLETED_LESSONS, JSON.stringify(current));
      notifyProgressUpdated();
    }
  } catch (err) {
    console.error("Erreur marquer leçon terminée:", err);
  }
}

export function getCompletedInquiries(): string[] {
  if (!isClient()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COMPLETED_INQUIRIES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markInquiryCompleted(inquiryId: string): void {
  if (!isClient()) return;
  try {
    const current = getCompletedInquiries();
    if (!current.includes(inquiryId)) {
      current.push(inquiryId);
      localStorage.setItem(STORAGE_KEYS.COMPLETED_INQUIRIES, JSON.stringify(current));
      notifyProgressUpdated();
    }
  } catch (err) {
    console.error("Erreur marquer enquête terminée:", err);
  }
}

/**
 * Reconstruit le profil méthodologique courant de l'utilisateur
 */
export function getUserMethodologicalProfile(): MethodologicalProfile {
  const attempts = getSkillAttempts();
  const diag = getDiagnosticAttempt();
  const finalAssess = getFinalAssessmentAttempt();

  return buildMethodologicalProfile(attempts, !!diag, !!finalAssess);
}

/**
 * Prépare l'export des données locales pour la future synchronisation compte (Phase 6)
 */
export function exportUserProgressData() {
  return {
    skillAttempts: getSkillAttempts(),
    diagnosticAttempt: getDiagnosticAttempt(),
    finalAssessmentAttempt: getFinalAssessmentAttempt(),
    completedLessons: getCompletedLessons(),
    completedInquiries: getCompletedInquiries(),
    exportedAt: new Date().toISOString(),
  };
}

/**
 * Réinitialise la progression locale (pour tests ou réinitialisation volontaire)
 */
export function clearAllLocalProgress(): void {
  if (!isClient()) return;
  for (const key of Object.values(STORAGE_KEYS)) {
    localStorage.removeItem(key);
  }
  notifyProgressUpdated();
}

export function recordSkillAttempt(
  attemptInput: Omit<SkillAttempt, "id" | "timestamp"> & { id?: string; timestamp?: string }
): void {
  const attempt: SkillAttempt = {
    id:
      attemptInput.id ||
      `${attemptInput.sourceId}-${attemptInput.skillId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: attemptInput.timestamp || new Date().toISOString(),
    ...attemptInput,
  };
  saveSkillAttempt(attempt);
}

export const getStoredProfile = getUserMethodologicalProfile;
export const getStoredAttempts = getSkillAttempts;
export const getCompletedLessonSlugs = getCompletedLessons;
export const getCompletedInquirySlugs = getCompletedInquiries;
export const initializeEmptyProfile = createInitialMethodologicalProfile;

export function saveStoredProfile(profile: MethodologicalProfile): void {
  if (!isClient()) return;
  try {
    localStorage.setItem("tabayyun_cached_profile", JSON.stringify(profile));
  } catch (err) {
    console.error("Erreur d'enregistrement du profil:", err);
  }
}
