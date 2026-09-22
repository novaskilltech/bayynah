"use client";

import { useEffect, useRef, useCallback } from "react";
import { TelemetryEvent } from "@/lib/telemetry";

const SESSION_STORAGE_KEY = "tabayyun_pilot_session_id";

/**
 * Récupère ou génère un identifiant de session éphémère pour le pilote.
 * Stocké en sessionStorage (détruit dès la fermeture du navigateur).
 */
export function getOrCreatePilotSessionId(): string {
  if (typeof window === "undefined") {
    return "server-session";
  }

  try {
    let sid = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!sid) {
      // Générer un UUIDv4 simple
      sid = "pilot_" + crypto.randomUUID();
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, sid);
    }
    return sid;
  } catch {
    return "memory_session_" + Math.random().toString(36).substring(2, 15);
  }
}

/**
 * Envoie un événement de télémétrie de manière asynchrone et non-bloquante.
 */
export async function sendTelemetryEvent(
  event: Omit<TelemetryEvent, "sessionId">
): Promise<void> {
  if (typeof window === "undefined") return;

  const sessionId = getOrCreatePilotSessionId();
  const payload: TelemetryEvent = {
    ...event,
    sessionId,
  };

  try {
    // Utiliser fetch avec keepalive pour survivre aux navigations de page
    await fetch("/api/telemetry", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // Échec silencieux : la télémétrie ne doit jamais bloquer ou alerter l'utilisateur
  }
}

export interface UsePedagogicalTrackerOptions {
  resourceType: "lesson" | "inquiry" | "diagnostic" | "final_assessment" | "glossary";
  resourceId: string;
  autoTrackOpen?: boolean;
}

/**
 * Hook React pour mesurer les temps passés, les étapes d'enquête et les interactions.
 */
export function usePedagogicalTracker({
  resourceType,
  resourceId,
  autoTrackOpen = true,
}: UsePedagogicalTrackerOptions) {
  const startTimeRef = useRef<number | null>(null);
  const lastStepTimeRef = useRef<number | null>(null);
  const currentStepRef = useRef<number>(0);
  const isCompletedRef = useRef<boolean>(false);

  // 1. Événement d'ouverture automatique
  useEffect(() => {
    const now = Date.now();
    startTimeRef.current = now;
    lastStepTimeRef.current = now;
    isCompletedRef.current = false;

    if (autoTrackOpen) {
      let eventType: TelemetryEvent["eventType"] = "LESSON_OPENED";
      if (resourceType === "diagnostic") eventType = "DIAGNOSTIC_STARTED";
      else if (resourceType === "inquiry") eventType = "LESSON_OPENED"; // ou étape 0

      sendTelemetryEvent({
        eventType,
        resourceType,
        resourceId,
        stepNumber: 0,
        durationMs: 0,
      });
    }

    // 2. Gestion de l'abandon en cas de démontage sans complétion
    return () => {
      if (!isCompletedRef.current && resourceType === "inquiry") {
        const totalDuration = startTimeRef.current ? Date.now() - startTimeRef.current : 0;
        sendTelemetryEvent({
          eventType: "INQUIRY_ABANDONED",
          resourceType,
          resourceId,
          stepNumber: currentStepRef.current,
          durationMs: totalDuration,
        });
      }
    };
  }, [resourceType, resourceId, autoTrackOpen]);

  // 3. Suivi du passage d'étape
  const trackStepAnswered = useCallback(
    (stepNumber: number, metadata?: Record<string, unknown>) => {
      const now = Date.now();
      const last = lastStepTimeRef.current ?? now;
      const stepDuration = now - last;
      lastStepTimeRef.current = now;
      currentStepRef.current = stepNumber;

      sendTelemetryEvent({
        eventType: "INQUIRY_STEP_ANSWERED",
        resourceType,
        resourceId,
        stepNumber,
        durationMs: stepDuration,
        metadata,
      });
    },
    [resourceType, resourceId]
  );

  // 4. Suivi de la complétion
  const trackCompleted = useCallback(
    (metadata?: Record<string, unknown>) => {
      isCompletedRef.current = true;
      const now = Date.now();
      const start = startTimeRef.current ?? now;
      const totalDuration = now - start;

      let eventType: TelemetryEvent["eventType"] = "LESSON_COMPLETED";
      if (resourceType === "final_assessment") eventType = "FINAL_ASSESSMENT_COMPLETED";

      sendTelemetryEvent({
        eventType,
        resourceType,
        resourceId,
        stepNumber: currentStepRef.current,
        durationMs: totalDuration,
        metadata,
      });
    },
    [resourceType, resourceId]
  );

  // 5. Suivi de l'ouverture d'un terme du lexique
  const trackGlossaryOpen = useCallback((termId: string) => {
    sendTelemetryEvent({
      eventType: "GLOSSARY_OPENED",
      resourceType: "glossary",
      resourceId: termId,
      metadata: { openedFrom: resourceId },
    });
  }, [resourceId]);

  return {
    trackStepAnswered,
    trackCompleted,
    trackGlossaryOpen,
  };
}
