import { z } from "zod";

// Schéma de validation strict pour les événements de télémétrie pédagogique
export const TelemetryEventSchema = z.object({
  sessionId: z.string().min(8).max(64),
  eventType: z.enum([
    "DIAGNOSTIC_STARTED",
    "LESSON_OPENED",
    "LESSON_COMPLETED",
    "INQUIRY_STEP_ANSWERED",
    "INQUIRY_ABANDONED",
    "GLOSSARY_OPENED",
    "FINAL_ASSESSMENT_COMPLETED",
  ]),
  resourceType: z.enum(["lesson", "inquiry", "diagnostic", "final_assessment", "glossary"]).optional(),
  resourceId: z.string().max(128).optional(),
  stepNumber: z.number().int().min(0).max(100).optional(),
  durationMs: z.number().int().min(0).max(24 * 60 * 60 * 1000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type TelemetryEvent = z.infer<typeof TelemetryEventSchema>;

/**
 * Filtre récursif pour s'assurer qu'aucune donnée sensible ou texte libre non sollicité
 * n'est injecté dans les métadonnées de télémétrie.
 */
export function sanitizeTelemetryMetadata(meta?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!meta) return undefined;

  const forbiddenKeys = [
    "ip",
    "ipaddress",
    "email",
    "password",
    "token",
    "secret",
    "name",
    "phone",
    "free_text",
    "comment",
  ];

  const clean: Record<string, unknown> = {};

  for (const [key, val] of Object.entries(meta)) {
    const lowerKey = key.toLowerCase();
    if (forbiddenKeys.some((f) => lowerKey.includes(f))) {
      continue; // Supprimer tout champ potentiellement sensible
    }

    // N'autoriser que les types primitifs techniques ou les petits objets
    if (typeof val === "string") {
      // Limiter la longueur des valeurs textuelles à 100 caractères (anti-injection de texte libre)
      clean[key] = val.slice(0, 100);
    } else if (typeof val === "number" || typeof val === "boolean") {
      clean[key] = val;
    }
  }

  return Object.keys(clean).length > 0 ? clean : undefined;
}
