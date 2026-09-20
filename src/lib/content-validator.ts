import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { LessonFrontmatterSchema } from "./schemas/lesson.schema";
import { InquirySchema } from "./schemas/inquiry.schema";

/**
 * Validateur de contenu Tabayyun (Phase 2.1 Integrity Gate)
 * Utilise gray-matter pour un parsing YAML robuste des objets imbriqués.
 * Valide les leçons et les enquêtes contre leurs schémas Zod respectifs.
 * Vérifie l'intégrité référentielle des evidenceIds dans les conclusions.
 */
export function validateAllContent(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const lessonsDir = path.join(process.cwd(), "content", "lessons");
  const inquiriesDir = path.join(process.cwd(), "content", "inquiries");

  // 1. Valider les leçons Markdown
  if (fs.existsSync(lessonsDir)) {
    const files = fs.readdirSync(lessonsDir).filter((f) => f.endsWith(".md"));
    for (const file of files) {
      const filePath = path.join(lessonsDir, file);
      try {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        const parsed = matter(fileContent);

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
        errors.push(`[Leçon ${file}] Erreur de parsing frontmatter (gray-matter) : ${err.message}`);
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

        // Vérification de l'intégrité référentielle des evidenceIds
        const inquiry = result.data;
        const declaredEvidenceIds = new Set(
          inquiry.inquiryEvidences.map((ie) => ie.evidenceId)
        );

        // Vérifier les preuves déclarées dans les étapes
        for (const step of inquiry.steps) {
          for (const evId of step.revealedEvidenceIds) {
            if (!declaredEvidenceIds.has(evId)) {
              errors.push(
                `[Enquête ${file}] Étape ${step.stepNumber} référence une preuve inexistante : "${evId}".`
              );
            }
          }
        }

        // Vérifier les preuves déclarées dans les claims de la conclusion
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
    console.error("❌ Échec de validation des contenus scientifiques (Phase 2.1 Integrity Gate) :");
    errors.forEach((e) => console.error(e));
    process.exit(1);
  } else {
    console.log("✅ Tous les contenus scientifiques respectent rigoureusement les schémas Zod et l'intégrité référentielle.");
  }
}
