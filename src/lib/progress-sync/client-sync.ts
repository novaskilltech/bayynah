import {
  SyncPayload,
  SyncResult,
  SkillAttemptInput,
  DiagnosticAttemptInput,
  FinalAssessmentAttemptInput,
} from "./types";
import {
  getSkillAttempts,
  getDiagnosticAttempt,
  getFinalAssessmentAttempt,
  getCompletedLessons,
  getCompletedInquiries,
} from "@/lib/storage-adapter";
import { AttestationData } from "@/types/skills";

const CLIENT_STORAGE_KEYS = {
  PENDING_SYNC: "tabayyun_pending_sync",
  LAST_SYNC_AT: "tabayyun_last_sync_at",
  SERVER_ATTESTATIONS: "tabayyun_server_attestations",
};

function isClient(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

/**
 * Récupère la file d'attente des éléments en attente de synchronisation
 */
export function getPendingSyncQueue(): SyncPayload {
  if (!isClient()) {
    return { skillAttempts: [] };
  }
  try {
    const raw = localStorage.getItem(CLIENT_STORAGE_KEYS.PENDING_SYNC);
    if (!raw) return { skillAttempts: [] };
    return JSON.parse(raw);
  } catch (err) {
    console.error("Erreur lecture pending sync:", err);
    return { skillAttempts: [] };
  }
}

/**
 * Sauvegarde la file d'attente locale
 */
function savePendingSyncQueue(queue: SyncPayload): void {
  if (!isClient()) return;
  try {
    localStorage.setItem(CLIENT_STORAGE_KEYS.PENDING_SYNC, JSON.stringify(queue));
  } catch (err) {
    console.error("Erreur sauvegarde pending sync:", err);
  }
}

/**
 * Ajoute un SkillAttempt dans la file d'attente locale
 */
export function enqueueSkillAttemptForSync(attempt: SkillAttemptInput): void {
  const queue = getPendingSyncQueue();
  queue.skillAttempts.push(attempt);
  savePendingSyncQueue(queue);
}

/**
 * Prépare un payload complet avec l'ensemble des données locales (pour la première synchronisation post-connexion)
 */
export function buildFullLocalSyncPayload(): SyncPayload {
  const localAttempts = getSkillAttempts();
  const localDiag = getDiagnosticAttempt();
  const localFinal = getFinalAssessmentAttempt();
  const completedLessons = getCompletedLessons();
  const completedInquiries = getCompletedInquiries();

  const skillAttempts: SkillAttemptInput[] = localAttempts.map((a) => ({
    id: a.id,
    skillId: a.skillId,
    contextId: a.sourceId,
    contextType: a.sourceType === "INQUIRY_STEP" ? "INQUIRY" : a.sourceType === "LESSON_QUIZ" ? "LESSON" : (a.sourceType as SkillAttemptInput["contextType"]),
    score: a.firstScore === 3 ? 1.0 : a.finalScore === 3 ? 0.8 : a.firstScore === 2 ? 0.66 : 0.2,
    weight: 1.0,
    metadata: {
      firstScore: a.firstScore,
      finalScore: a.finalScore,
      attemptCount: a.attemptCount,
      correctedAfterFeedback: a.correctedAfterFeedback,
      stepNumber: a.stepNumber,
    },
    clientTimestamp: a.timestamp,
  }));

  const diagnosticAttempts: DiagnosticAttemptInput[] = localDiag
    ? [
        {
          id: `diag-${Date.parse(localDiag.completedAt) || Date.now()}`,
          scorePercent:
            Object.values(localDiag.skillScores).reduce((acc, s) => acc + s.percentage, 0) /
            (Object.keys(localDiag.skillScores).length || 1),
          answers: localDiag.answers,
          rulesVersion: "diagnostic-v1",
          clientTimestamp: localDiag.completedAt,
        },
      ]
    : [];

  const finalAssessmentAttempts: FinalAssessmentAttemptInput[] = localFinal
    ? [
        {
          id: `final-${Date.parse(localFinal.completedAt) || Date.now()}`,
          scorePercent: localFinal.globalPercentage,
          answers: localFinal.answers,
          rulesVersion: localFinal.rulesVersion || "assessment-v1",
          clientTimestamp: localFinal.completedAt,
        },
      ]
    : [];

  const completedContentIds = [...completedLessons, ...completedInquiries];

  return {
    skillAttempts,
    diagnosticAttempts,
    finalAssessmentAttempts,
    completedContentIds,
  };
}

/**
 * Envoie la synchronisation au serveur
 */
export async function syncLocalProgressToServer(): Promise<SyncResult | null> {
  if (!isClient()) return null;

  // On fusionne la file d'attente locale et les données existantes
  const pendingQueue = getPendingSyncQueue();
  const fullPayload = buildFullLocalSyncPayload();

  // Fusionner les attempts par ID
  const map = new Map<string, SkillAttemptInput>();
  for (const a of fullPayload.skillAttempts) map.set(a.id, a);
  for (const a of pendingQueue.skillAttempts) map.set(a.id, a);

  const payload: SyncPayload = {
    skillAttempts: Array.from(map.values()),
    diagnosticAttempts: fullPayload.diagnosticAttempts,
    finalAssessmentAttempts: fullPayload.finalAssessmentAttempts,
    completedContentIds: fullPayload.completedContentIds,
  };

  try {
    const res = await fetch("/api/progress/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      if (res.status === 401) {
        // Non connecté : reste en file d'attente locale sans lever d'erreur bloquante
        return null;
      }
      throw new Error(`Échec synchronisation: HTTP ${res.status}`);
    }

    const result: SyncResult = await res.json();

    // Vider la file d'attente après succès
    savePendingSyncQueue({ skillAttempts: [] });
    localStorage.setItem(CLIENT_STORAGE_KEYS.LAST_SYNC_AT, result.syncTimestamp);

    // Mettre à jour les attestations serveur reçues
    if (result.attestations) {
      localStorage.setItem(CLIENT_STORAGE_KEYS.SERVER_ATTESTATIONS, JSON.stringify(result.attestations));
    }

    // Émettre un événement pour notifier l'UI
    window.dispatchEvent(new CustomEvent("tabayyun_sync_completed", { detail: result }));

    return result;
  } catch (err) {
    console.warn("Synchronisation différée (mode hors-ligne ou erreur réseau):", err);
    return null;
  }
}

/**
 * Récupère les attestations certifiées par le serveur
 */
export function getServerAttestations(): AttestationData[] {
  if (!isClient()) return [];
  try {
    const raw = localStorage.getItem(CLIENT_STORAGE_KEYS.SERVER_ATTESTATIONS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Date de dernière synchronisation réussie
 */
export function getLastSyncTimestamp(): string | null {
  if (!isClient()) return null;
  return localStorage.getItem(CLIENT_STORAGE_KEYS.LAST_SYNC_AT);
}
