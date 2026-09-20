import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { LessonFrontmatterSchema } from "./schemas/lesson.schema";
import { InquirySchema } from "./schemas/inquiry.schema";

/**
 * Validateur de contenu Tabayyun (Phase 2.1 - Integrity Gate Strict)
 * - Utilise gray-matter restreint au YAML pur (aucun moteur exécutable).
 * - Valide le frontmatter contre LessonFrontmatterSchema (Zod 4).
 * - Valide les enquêtes JSON contre InquirySchema (Zod 4).
 * - Contrôles croisés stricts :
 *     1. Aucun ID de preuve orphelin.
 *     2. Aucun doublon d'evidenceId dans inquiryEvidences.
 *     3. Tout contenu PUBLISHED ne doit comporter aucune preuve TO_BE_CHECKED.
 */
export function validateAllContent(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const lessonsDir = path.join(process.cwd(), "content", "lessons");
  const inquiriesDir = path.join(process.cwd(), "content", "inquiries");

  // 1. Valider les leçons Markdown (YAML pur uniquement)
  if (fs.existsSync(lessonsDir)) {
    const files = fs.readdirSync(lessonsDir).filter((f) => f.endsWith(".md"));
    for (const file of files) {
      const filePath = path.join(lessonsDir, file);
      try {
        const fileContent = fs.readFileSync(filePath, "utf-8");

        // Désactivation stricte de tout moteur JS exécutable dans gray-matter
        const parsed = matter(fileContent, {
          engines: {
            javascript: () => {
              throw new Error("L'exécution de JavaScript dans le frontmatter est strictement interdite.");
            },
          },
        });

        if (!parsed.data || Object.keys(parsed.data).length === 0) {
          errors.push(`[Leçon ${file}] Frontmatter YAML manquant ou vide.`);
          continue;
        }

        const result = LessonFrontmatterSchema.safeParse(parsed.data);
        if (!result.success) {
          errors.push(
            `[Leçon ${file}] Erreur de validation Zod:\n` +
              JSON.stringify(result.error.format(), null, 2)
          );
        }
      } catch (err: any) {
        errors.push(`[Leçon ${file}] Erreur de parsing YAML (gray-matter) : ${err.message}`);
      }
    }
  }

  // 2. Valider les enquêtes JSON
  if (fs.existsSync(inquiriesDir)) {
    const files = fs.readdirSync(inquiriesDir).filter((f) => f.endsWith(".json"));
    for (const file of files) {
      const filePath = path.join(inquiriesDir, file);
      try {
        const jsonContent = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        const result = InquirySchema.safeParse(jsonContent);
        if (!result.success) {
          errors.push(
            `[Enquête ${file}] Erreur de validation Zod:\n` +
              JSON.stringify(result.error.format(), null, 2)
          );
          continue;
        }

        const inquiry = result.data;
        const declaredEvidenceIds = new Set<string>();
        const duplicates: string[] = [];

        for (const ie of inquiry.inquiryEvidences) {
          if (declaredEvidenceIds.has(ie.evidenceId)) {
            duplicates.push(ie.evidenceId);
          }
          declaredEvidenceIds.add(ie.evidenceId);
        }

        if (duplicates.length > 0) {
          errors.push(
            `[Enquête ${file}] Doublon(s) d'evidenceId détecté(s) dans inquiryEvidences : ${duplicates.join(", ")}`
          );
        }

        // Vérifier les preuves déclarées dans les étapes
        for (const step of inquiry.steps) {
          for (const evId of step.revealedEvidenceIds) {
            if (!declaredEvidenceIds.has(evId)) {
              errors.push(
                `[Enquête ${file}] Étape ${step.stepNumber} référence une preuve inexistante dans inquiryEvidences : "${evId}".`
              );
            }
          }
        }

        // Vérifier les preuves déclarées dans les affirmations de la conclusion
        const conclusion = inquiry.conclusionSheet;
        const claimKeys: (keyof typeof conclusion)[] = [
          "established",
          "discussed",
          "notEstablished",
          "salafUnderstanding",
          "scholarlyPositions",
          "methodologicalPitfall",
        ];

        for (const key of claimKeys) {
          const claim = conclusion[key] as { evidenceIds?: string[] };
          if (claim && claim.evidenceIds) {
            for (const evId of claim.evidenceIds) {
              if (!declaredEvidenceIds.has(evId)) {
                errors.push(
                  `[Enquête ${file}] Conclusion (${key}) référence une preuve non déclarée dans inquiryEvidences : "${evId}".`
                );
              }
            }
          }
        }

        // Contrôle renforcé : si statut PUBLISHED, aucune preuve liée ne peut être TO_BE_CHECKED
        if (inquiry.editorialStatus === "PUBLISHED") {
          for (const ie of inquiry.inquiryEvidences) {
            if (ie.evidence && ie.evidence.citationStatus === "TO_BE_CHECKED") {
              errors.push(
                `[Enquête ${file}] L'enquête est PUBLISHED mais contient une preuve non certifiée (TO_BE_CHECKED) : "${ie.evidenceId}".`
              );
            }
          }
        }
      } catch (err: any) {
        errors.push(`[Enquête ${file}] Erreur JSON : ${err.message}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

if (require.main === module) {
  const { valid, errors } = validateAllContent();
  if (!valid) {
    console.error("❌ Échec de l'Integrity Gate — Contenus scientifiques non conformes :");
    errors.forEach((e) => console.error(e));
    process.exit(1);
  } else {
    console.log("✅ Integrity Gate passée avec succès : schémas Zod, YAML pur et intégrité référentielle validés.");
  }
}
