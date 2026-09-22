import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { LessonFrontmatterSchema } from "./schemas/lesson.schema";
import { InquirySchema } from "./schemas/inquiry.schema";
import { SKILLS_METADATA, LESSON_SKILLS_MAP, INQUIRY_STEP_SKILLS_MAP } from "./skills-registry";
import { RECOMMENDED_PREREQUISITES, LEARNING_PATH_LEVELS } from "./learning-path";
import { MethodologicalSkill } from "../types/skills";
import { DiagnosticQuestionSchema, FinalAssessmentScenarioSchema } from "./schemas/skills.schema";
import { GlossaryFileSchema } from "./schemas/glossary.schema";

/**
 * Validateur de contenu Tabayyun (Phase 2.1 & Phase 5 - Integrity Gate Étendu)
 * - Utilise gray-matter restreint au YAML pur (aucun moteur exécutable).
 * - Valide le frontmatter contre LessonFrontmatterSchema (Zod 4).
 * - Valide les enquêtes JSON contre InquirySchema (Zod 4).
 * - Contrôles croisés stricts :
 *     1. Aucun ID de preuve orphelin.
 *     2. Aucun doublon d'evidenceId dans inquiryEvidences.
 *     3. Tout contenu PUBLISHED ne doit comporter aucune preuve TO_BE_CHECKED.
 *     4. Intégrité du modèle de compétences (Phase 5) :
 *        - Aucune compétence canonique orpheline.
 *        - Toutes les leçons et étapes mappées existent physiquement.
 *        - Tous les prérequis recommandés et niveaux ciblent des contenus réels.
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
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        errors.push(`[Leçon ${file}] Erreur de parsing YAML (gray-matter) : ${errorMsg}`);
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
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        errors.push(`[Enquête ${file}] Erreur JSON : ${errorMsg}`);
      }
    }
  }

  // 3. Valider l'intégrité du Modèle de Compétences (Phase 5)
  const existingLessonSlugs = new Set(
    fs.existsSync(lessonsDir)
      ? fs.readdirSync(lessonsDir).filter((f) => f.endsWith(".md")).map((f) => f.replace(/\.md$/, ""))
      : []
  );

  const existingInquirySlugs = new Set<string>();
  if (fs.existsSync(inquiriesDir)) {
    const inquiryFiles = fs.readdirSync(inquiriesDir).filter((f) => f.endsWith(".json"));
    for (const file of inquiryFiles) {
      try {
        const json = JSON.parse(fs.readFileSync(path.join(inquiriesDir, file), "utf-8"));
        if (json.slug) existingInquirySlugs.add(json.slug);
      } catch {
        // Erreurs déjà gérées par la validation Zod des enquêtes
      }
    }
  }

  // 3.1 Vérifier que chaque leçon déclarée dans LESSON_SKILLS_MAP existe physiquement
  for (const lessonSlug of Object.keys(LESSON_SKILLS_MAP)) {
    if (!existingLessonSlugs.has(lessonSlug)) {
      errors.push(`[Compétences Registry] La leçon "${lessonSlug}" déclarée dans LESSON_SKILLS_MAP n'existe pas dans content/lessons/.`);
    }
  }

  // 3.2 Vérifier que chaque enquête déclarée dans INQUIRY_STEP_SKILLS_MAP existe
  for (const inqSlug of Object.keys(INQUIRY_STEP_SKILLS_MAP)) {
    if (!existingInquirySlugs.has(inqSlug)) {
      errors.push(`[Compétences Registry] L'enquête "${inqSlug}" déclarée dans INQUIRY_STEP_SKILLS_MAP n'existe pas dans content/inquiries/.`);
    }
  }

  // 3.3 Vérifier qu'aucune compétence canonique n'est orpheline
  const referencedSkills = new Set<MethodologicalSkill>();
  for (const skills of Object.values(LESSON_SKILLS_MAP)) {
    skills.forEach((s) => referencedSkills.add(s));
  }
  for (const steps of Object.values(INQUIRY_STEP_SKILLS_MAP)) {
    for (const skills of Object.values(steps)) {
      skills.forEach((s) => referencedSkills.add(s));
    }
  }

  for (const skillId of Object.keys(SKILLS_METADATA) as MethodologicalSkill[]) {
    if (!referencedSkills.has(skillId)) {
      errors.push(`[Compétences Registry] La compétence canonique "${skillId}" est orpheline (aucun exercice/leçon ne la couvre).`);
    }
  }

  // 3.4 Vérifier la cohérence des prérequis recommandés
  for (const [targetInq, reqs] of Object.entries(RECOMMENDED_PREREQUISITES)) {
    if (!existingInquirySlugs.has(targetInq)) {
      errors.push(`[Prérequis] La cible "${targetInq}" dans RECOMMENDED_PREREQUISITES n'existe pas dans les enquêtes.`);
    }
    for (const lId of reqs.lessonIds) {
      if (!existingLessonSlugs.has(lId)) {
        errors.push(`[Prérequis] Le prérequis de leçon "${lId}" pour l'enquête "${targetInq}" n'existe pas.`);
      }
    }
    for (const inqId of reqs.inquiryIds) {
      if (!existingInquirySlugs.has(inqId)) {
        errors.push(`[Prérequis] Le prérequis d'enquête "${inqId}" pour l'enquête "${targetInq}" n'existe pas.`);
      }
    }
  }

  // 3.5 Vérifier la cohérence des paliers du parcours
  for (const level of LEARNING_PATH_LEVELS) {
    for (const lId of level.lessonIds) {
      if (!existingLessonSlugs.has(lId)) {
        errors.push(`[Parcours Niveau ${level.levelNumber}] La leçon "${lId}" n'existe pas dans content/lessons/.`);
      }
    }
    for (const inqId of level.inquiryIds) {
      if (!existingInquirySlugs.has(inqId)) {
        errors.push(`[Parcours Niveau ${level.levelNumber}] L'enquête "${inqId}" n'existe pas dans content/inquiries/.`);
      }
    }
  }

  // 4. Valider le Diagnostic Initial
  const diagnosticFile = path.join(process.cwd(), "content", "diagnostic", "questions.json");
  if (fs.existsSync(diagnosticFile)) {
    try {
      const json = JSON.parse(fs.readFileSync(diagnosticFile, "utf-8"));
      if (!Array.isArray(json)) {
        errors.push("[Diagnostic] Le fichier questions.json doit contenir un tableau de questions.");
      } else {
        json.forEach((q, idx) => {
          const result = DiagnosticQuestionSchema.safeParse(q);
          if (!result.success) {
            errors.push(`[Diagnostic Question #${idx + 1} (${q.id || "sans-id"})] Erreur Zod : ` + JSON.stringify(result.error.format(), null, 2));
          }
        });
      }
    } catch (err: unknown) {
      errors.push(`[Diagnostic] Erreur de parsing JSON : ${err instanceof Error ? err.message : String(err)}`);
    }
  } else {
    errors.push("[Diagnostic] Le fichier content/diagnostic/questions.json est introuvable.");
  }

  // 5. Valider l'Évaluation Finale
  const assessmentFile = path.join(process.cwd(), "content", "assessment", "scenarios.json");
  if (fs.existsSync(assessmentFile)) {
    try {
      const json = JSON.parse(fs.readFileSync(assessmentFile, "utf-8"));
      if (!Array.isArray(json)) {
        errors.push("[Évaluation Finale] Le fichier scenarios.json doit contenir un tableau de scénarios.");
      } else {
        json.forEach((s, idx) => {
          const result = FinalAssessmentScenarioSchema.safeParse(s);
          if (!result.success) {
            errors.push(`[Évaluation Finale Scénario #${idx + 1} (${s.id || "sans-id"})] Erreur Zod : ` + JSON.stringify(result.error.format(), null, 2));
          }
        });
      }
    } catch (err: unknown) {
      errors.push(`[Évaluation Finale] Erreur de parsing JSON : ${err instanceof Error ? err.message : String(err)}`);
    }
  } else {
    errors.push("[Évaluation Finale] Le fichier content/assessment/scenarios.json est introuvable.");
  }

  // 6. Valider le Lexique Méthodologique (Phase 8.1 - Integrity Gate)
  const glossaryFile = path.join(process.cwd(), "content", "glossary", "terms.json");
  if (fs.existsSync(glossaryFile)) {
    try {
      const json = JSON.parse(fs.readFileSync(glossaryFile, "utf-8"));
      const result = GlossaryFileSchema.safeParse(json);
      if (!result.success) {
        errors.push("[Lexique Méthodologique] Erreur de validation Zod :\n" + JSON.stringify(result.error.format(), null, 2));
      } else {
        const termIds = new Set<string>();
        for (const term of result.data) {
          if (termIds.has(term.id)) {
            errors.push(`[Lexique Méthodologique] Doublon d'identifiant de terme : ${term.id}`);
          }
          termIds.add(term.id);

          if (term.editorialStatus === "PUBLISHED" && (!term.reviewerId || !term.reviewedAt)) {
            errors.push(`[Lexique Méthodologique ${term.id}] Un terme PUBLISHED doit comporter reviewerId et reviewedAt.`);
          }
        }
      }
    } catch (err: unknown) {
      errors.push(`[Lexique Méthodologique] Erreur de parsing JSON : ${err instanceof Error ? err.message : String(err)}`);
    }
  } else {
    errors.push("[Lexique Méthodologique] Le fichier content/glossary/terms.json est introuvable.");
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
