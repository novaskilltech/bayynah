"use client";

import { useEffect, useRef, useCallback } from "react";
import {
  VALID_LESSON_SLUGS,
  VALID_INQUIRY_IDS_AND_SLUGS,
  VALID_GLOSSARY_TERM_IDS,
  CANONICAL_SCHOOLS,
  CANONICAL_CERTAINTY_LEVELS,
} from "@/lib/telemetry-contract";

const PILOT_SESSION_STORAGE_KEY = "tabayyun_pilot_session";
const PILOT_OPT_OUT_KEY = "tabayyun_telemetry_opt_out";

export interface StoredPilotSession {
  pilotSessionId: string;
  pilotSessionSignature: string;
  expiresAt: number;
}

export type TelemetryClientPayload =
  | {
      eventType: "DIAGNOSTIC_STARTED";
      resourceType: "diagnostic";
      resourceId: "diagnostic-initial";
      stepNumber?: number;
      durationMs?: number;
      metadata?: { questionCount?: number };
    }
  | {
      eventType: "DIAGNOSTIC_COMPLETED";
      resourceType: "diagnostic";
      resourceId: "diagnostic-initial";
      stepNumber?: number;
      durationMs?: number;
      metadata: { totalQuestions: number; correctAnswers: number; initialScorePercent: number };
    }
  | {
      eventType: "LESSON_OPENED";
      resourceType: "lesson";
      resourceId: typeof VALID_LESSON_SLUGS[number];
      stepNumber?: number;
      durationMs?: number;
      metadata?: { school?: typeof CANONICAL_SCHOOLS[number]; level?: number };
    }
  | {
      eventType: "LESSON_COMPLETED";
      resourceType: "lesson";
      resourceId: typeof VALID_LESSON_SLUGS[number];
      stepNumber?: number;
      durationMs?: number;
      metadata: { quizScorePercent: number; passed: boolean };
    }
  | {
      eventType: "INQUIRY_STARTED";
      resourceType: "inquiry";
      resourceId: typeof VALID_INQUIRY_IDS_AND_SLUGS[number];
      stepNumber?: number;
      durationMs?: number;
      metadata?: { certaintyLevelTarget?: typeof CANONICAL_CERTAINTY_LEVELS[number] };
    }
  | {
      eventType: "INQUIRY_STEP_ANSWERED";
      resourceType: "inquiry";
      resourceId: typeof VALID_INQUIRY_IDS_AND_SLUGS[number];
      stepNumber: number;
      durationMs?: number;
      metadata: {
        quality: "INCORRECT" | "PREMATURE" | "ACCEPTABLE" | "BEST";
        methodologicalScore: number;
        attemptNumber: number;
      };
    }
  | {
      eventType: "INQUIRY_ABANDONED";
      resourceType: "inquiry";
      resourceId: typeof VALID_INQUIRY_IDS_AND_SLUGS[number];
      stepNumber?: number;
      durationMs?: number;
      metadata?: { lastCompletedStep?: number };
    }
  | {
      eventType: "INQUIRY_COMPLETED";
      resourceType: "inquiry";
      resourceId: typeof VALID_INQUIRY_IDS_AND_SLUGS[number];
      stepNumber?: number;
      durationMs?: number;
      metadata: {
        finalQuality: "INCORRECT" | "PREMATURE" | "ACCEPTABLE" | "BEST";
        totalMethodologicalScore: number;
        stepsCount: number;
      };
    }
  | {
      eventType: "FINAL_ASSESSMENT_STARTED";
      resourceType: "final_assessment";
      resourceId: "evaluation-finale";
      stepNumber?: number;
      durationMs?: number;
      metadata?: { totalQuestions?: number };
    }
  | {
      eventType: "FINAL_ASSESSMENT_COMPLETED";
      resourceType: "final_assessment";
      resourceId: "evaluation-finale";
      stepNumber?: number;
      durationMs?: number;
      metadata: {
        finalScorePercent: number;
        eligibleForAttestation: boolean;
        attestationType?: "PARCOURS" | "MAITRISE_METHODOLOGIQUE" | "NONE";
      };
    }
  | {
      eventType: "GLOSSARY_OPENED";
      resourceType: "glossary";
      resourceId: typeof VALID_GLOSSARY_TERM_IDS[number];
      stepNumber?: number;
      durationMs?: number;
      metadata?: {
        termId: typeof VALID_GLOSSARY_TERM_IDS[number];
        fromResourceType?: "lesson" | "inquiry" | "diagnostic" | "final_assessment";
        fromResourceId?: typeof VALID_LESSON_SLUGS[number] | typeof VALID_INQUIRY_IDS_AND_SLUGS[number] | "diagnostic-initial" | "evaluation-finale";
      };
    };

/**
 * Vérifie si l'utilisateur a activé l'opt-out de la télémétrie pilote.
 */
export function isTelemetryOptedOut(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return (
      window.localStorage.getItem(PILOT_OPT_OUT_KEY) === "true" ||
      window.sessionStorage.getItem(PILOT_OPT_OUT_KEY) === "true"
    );
  } catch {
    return false;
  }
}

/**
 * Active ou désactive l'opt-out de télémétrie.
 */
export function setTelemetryOptOut(optOut: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (optOut) {
      window.localStorage.setItem(PILOT_OPT_OUT_KEY, "true");
      window.sessionStorage.setItem(PILOT_OPT_OUT_KEY, "true");
      window.sessionStorage.removeItem(PILOT_SESSION_STORAGE_KEY);
    } else {
      window.localStorage.removeItem(PILOT_OPT_OUT_KEY);
      window.sessionStorage.removeItem(PILOT_OPT_OUT_KEY);
    }
    window.dispatchEvent(new Event("tabayyun-telemetry-opt-out-changed"));
  } catch {
    // Ignore
  }
}

let inFlightSessionPromise: Promise<StoredPilotSession | null> | null = null;

/**
 * Récupère ou négocie une session pilote signée HMAC auprès du serveur.
 */
export async function getValidPilotSession(): Promise<StoredPilotSession | null> {
  if (typeof window === "undefined") return null;
  if (isTelemetryOptedOut()) return null;

  try {
    const cached = window.sessionStorage.getItem(PILOT_SESSION_STORAGE_KEY);
    if (cached) {
      const parsed: StoredPilotSession = JSON.parse(cached);
      // Validité avec marge de sécurité de 60 secondes
      if (
        parsed.pilotSessionId &&
        parsed.pilotSessionSignature &&
        parsed.expiresAt > Date.now() + 60_000
      ) {
        return parsed;
      }
    }
  } catch {
    // Ignore parsing error
  }

  if (inFlightSessionPromise) {
    return inFlightSessionPromise;
  }

  inFlightSessionPromise = (async () => {
    try {
      const res = await fetch("/api/telemetry/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.success && data.session) {
        const session: StoredPilotSession = data.session;
        window.sessionStorage.setItem(PILOT_SESSION_STORAGE_KEY, JSON.stringify(session));
        return session;
      }
    } catch {
      // Défaillance réseau silencieuse
    } finally {
      inFlightSessionPromise = null;
    }
    return null;
  })();

  return inFlightSessionPromise;
}

/**
 * Envoie un événement de télémétrie pédagogique signé de façon asynchrone et non-bloquante.
 */
export async function sendTelemetryEvent(eventData: TelemetryClientPayload): Promise<void> {
  if (typeof window === "undefined") return;
  if (isTelemetryOptedOut()) return;

  try {
    const session = await getValidPilotSession();
    if (!session) return;

    const payload = {
      ...eventData,
      pilotSessionId: session.pilotSessionId,
      pilotSessionSignature: session.pilotSessionSignature,
      expiresAt: session.expiresAt,
    };

    await fetch("/api/telemetry", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // Échec silencieux garanti : la télémétrie n'interrompt jamais l'expérience d'apprentissage
  }
}

export type UsePedagogicalTrackerOptions =
  | {
      resourceType: "diagnostic";
      resourceId: "diagnostic-initial";
      autoTrackOpen?: boolean;
    }
  | {
      resourceType: "final_assessment";
      resourceId: "evaluation-finale";
      autoTrackOpen?: boolean;
    }
  | {
      resourceType: "lesson";
      resourceId: typeof VALID_LESSON_SLUGS[number];
      autoTrackOpen?: boolean;
    }
  | {
      resourceType: "inquiry";
      resourceId: typeof VALID_INQUIRY_IDS_AND_SLUGS[number];
      autoTrackOpen?: boolean;
    }
  | {
      resourceType: "glossary";
      resourceId: typeof VALID_GLOSSARY_TERM_IDS[number];
      autoTrackOpen?: boolean;
    };

/**
 * Hook React pour mesurer le parcours pédagogique sur les 11 événements canoniques.
 */
export function usePedagogicalTracker(options: UsePedagogicalTrackerOptions) {
  const { resourceType, resourceId, autoTrackOpen = true } = options;
  const startTimeRef = useRef<number | null>(null);
  const lastStepTimeRef = useRef<number | null>(null);
  const currentStepRef = useRef<number>(0);
  const isCompletedRef = useRef<boolean>(false);
  const hasInteractedRef = useRef<boolean>(false);
  const openedResourceRef = useRef<string | null>(null);

  // 1. Événement d'ouverture automatique (avec typage strict par type de ressource)
  useEffect(() => {
    const now = Date.now();
    startTimeRef.current = now;
    lastStepTimeRef.current = now;
    isCompletedRef.current = false;

    const resourceKey = `${resourceType}:${resourceId}`;
    if (autoTrackOpen && openedResourceRef.current !== resourceKey) {
      openedResourceRef.current = resourceKey;
      if (resourceType === "diagnostic") {
        sendTelemetryEvent({
          eventType: "DIAGNOSTIC_STARTED",
          resourceType: "diagnostic",
          resourceId: "diagnostic-initial",
          stepNumber: 0,
          durationMs: 0,
        });
      } else if (resourceType === "inquiry") {
        sendTelemetryEvent({
          eventType: "INQUIRY_STARTED",
          resourceType: "inquiry",
          resourceId: resourceId as typeof VALID_INQUIRY_IDS_AND_SLUGS[number],
          stepNumber: 0,
          durationMs: 0,
        });
      } else if (resourceType === "lesson") {
        sendTelemetryEvent({
          eventType: "LESSON_OPENED",
          resourceType: "lesson",
          resourceId: resourceId as typeof VALID_LESSON_SLUGS[number],
          stepNumber: 0,
          durationMs: 0,
        });
      } else if (resourceType === "final_assessment") {
        sendTelemetryEvent({
          eventType: "FINAL_ASSESSMENT_STARTED",
          resourceType: "final_assessment",
          resourceId: "evaluation-finale",
          stepNumber: 0,
          durationMs: 0,
        });
      }
    }

    // 2. Gestion de l'abandon : uniquement si l'enquête a réellement démarré avec interaction
    // (évite tout faux positif lié au double-mount de React StrictMode ou aux rebonds immédiats)
    return () => {
      if (
        !isCompletedRef.current &&
        resourceType === "inquiry" &&
        hasInteractedRef.current &&
        currentStepRef.current > 0
      ) {
        const totalDuration = startTimeRef.current ? Date.now() - startTimeRef.current : 0;
        sendTelemetryEvent({
          eventType: "INQUIRY_ABANDONED",
          resourceType: "inquiry",
          resourceId: resourceId as typeof VALID_INQUIRY_IDS_AND_SLUGS[number],
          stepNumber: currentStepRef.current,
          durationMs: totalDuration,
          metadata: { lastCompletedStep: currentStepRef.current },
        });
      }
    };
  }, [resourceType, resourceId, autoTrackOpen]);

  // 3. Suivi d'une réponse à une étape d'enquête
  const trackInquiryStep = useCallback(
    (
      stepNumber: number,
      metadata: {
        quality: "INCORRECT" | "PREMATURE" | "ACCEPTABLE" | "BEST";
        methodologicalScore: number;
        attemptNumber: number;
      }
    ) => {
      if (resourceType !== "inquiry") return;
      hasInteractedRef.current = true;
      const now = Date.now();
      const last = lastStepTimeRef.current ?? now;
      const stepDuration = now - last;
      lastStepTimeRef.current = now;
      currentStepRef.current = stepNumber;

      sendTelemetryEvent({
        eventType: "INQUIRY_STEP_ANSWERED",
        resourceType: "inquiry",
        resourceId: resourceId as typeof VALID_INQUIRY_IDS_AND_SLUGS[number],
        stepNumber,
        durationMs: stepDuration,
        metadata,
      });
    },
    [resourceType, resourceId]
  );

  // 4. Suivi de la complétion d'enquête
  const trackInquiryComplete = useCallback(
    (metadata: {
      finalQuality: "INCORRECT" | "PREMATURE" | "ACCEPTABLE" | "BEST";
      totalMethodologicalScore: number;
      stepsCount: number;
    }) => {
      if (resourceType !== "inquiry") return;
      isCompletedRef.current = true;
      const now = Date.now();
      const start = startTimeRef.current ?? now;
      const totalDuration = now - start;

      sendTelemetryEvent({
        eventType: "INQUIRY_COMPLETED",
        resourceType: "inquiry",
        resourceId: resourceId as typeof VALID_INQUIRY_IDS_AND_SLUGS[number],
        stepNumber: currentStepRef.current,
        durationMs: totalDuration,
        metadata,
      });
    },
    [resourceType, resourceId]
  );

  // 5. Suivi de la complétion de leçon
  const trackLessonComplete = useCallback(
    (metadata: { quizScorePercent: number; passed: boolean }) => {
      if (resourceType !== "lesson") return;
      isCompletedRef.current = true;
      const now = Date.now();
      const start = startTimeRef.current ?? now;
      const totalDuration = now - start;

      sendTelemetryEvent({
        eventType: "LESSON_COMPLETED",
        resourceType: "lesson",
        resourceId: resourceId as typeof VALID_LESSON_SLUGS[number],
        stepNumber: currentStepRef.current,
        durationMs: totalDuration,
        metadata,
      });
    },
    [resourceType, resourceId]
  );

  // 6. Suivi de l'ouverture d'un terme du lexique
  const trackGlossaryOpen = useCallback(
    (
      termId: typeof VALID_GLOSSARY_TERM_IDS[number],
      fromResourceType?: "lesson" | "inquiry" | "diagnostic" | "final_assessment",
      fromResourceId?: typeof VALID_LESSON_SLUGS[number] | typeof VALID_INQUIRY_IDS_AND_SLUGS[number] | "diagnostic-initial" | "evaluation-finale"
    ) => {
      sendTelemetryEvent({
        eventType: "GLOSSARY_OPENED",
        resourceType: "glossary",
        resourceId: termId,
        metadata: { termId, fromResourceType, fromResourceId },
      });
    },
    []
  );

  return {
    trackInquiryStep,
    trackInquiryComplete,
    trackLessonComplete,
    trackGlossaryOpen,
    isCompletedRef,
    hasInteractedRef,
  };
}
