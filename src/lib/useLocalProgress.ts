"use client";

import { useMemo, useSyncExternalStore } from "react";
import { buildMethodologicalProfile } from "@/lib/skills-calculator";
import { PROGRESS_UPDATED_EVENT, STORAGE_KEYS } from "@/lib/storage-adapter";
import type {
  DiagnosticAttempt,
  FinalAssessmentAttempt,
  SkillAttempt,
} from "@/types/skills";

const EMPTY_SNAPSHOT = JSON.stringify([null, null, null, null, null]);

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(PROGRESS_UPDATED_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(PROGRESS_UPDATED_EVENT, callback);
  };
}

function getSnapshot(): string {
  return JSON.stringify([
    localStorage.getItem(STORAGE_KEYS.SKILL_ATTEMPTS),
    localStorage.getItem(STORAGE_KEYS.DIAGNOSTIC_ATTEMPT),
    localStorage.getItem(STORAGE_KEYS.FINAL_ASSESSMENT_ATTEMPT),
    localStorage.getItem(STORAGE_KEYS.COMPLETED_LESSONS),
    localStorage.getItem(STORAGE_KEYS.COMPLETED_INQUIRIES),
  ]);
}

function getServerSnapshot(): string {
  return EMPTY_SNAPSHOT;
}

function parseStoredValue<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function useLocalProgress() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return useMemo(() => {
    const [attemptsRaw, diagnosticRaw, finalRaw, lessonsRaw, inquiriesRaw] = JSON.parse(snapshot) as (
      | string
      | null
    )[];
    const attempts = parseStoredValue<SkillAttempt[]>(attemptsRaw, []);
    const diagnosticAttempt = parseStoredValue<DiagnosticAttempt | null>(diagnosticRaw, null);
    const finalAssessmentAttempt = parseStoredValue<FinalAssessmentAttempt | null>(finalRaw, null);
    const completedLessons = parseStoredValue<string[]>(lessonsRaw, []);
    const completedInquiries = parseStoredValue<string[]>(inquiriesRaw, []);

    return {
      attempts,
      diagnosticAttempt,
      finalAssessmentAttempt,
      completedLessons,
      completedInquiries,
      profile: buildMethodologicalProfile(
        attempts,
        diagnosticAttempt !== null,
        finalAssessmentAttempt !== null
      ),
    };
  }, [snapshot]);
}
