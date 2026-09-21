import fs from "fs";
import path from "path";
import matter from "gray-matter";
import {
  LessonFrontmatterSchema,
  LessonFrontmatter,
  SchoolType,
  EditorialStatus,
} from "./schemas/lesson.schema";

export interface LessonSummary {
  id: string;
  slug: string;
  school: SchoolType;
  level: 1 | 2 | 3 | 4;
  order: number;
  editorialStatus: EditorialStatus;
  titleFr: string;
  titleAr: string;
  summaryFr: string;
  summaryAr: string;
  methodologyPrincipleFr: string;
  methodologyPrincipleAr: string;
  hasQuiz: boolean;
}

export interface LessonDetail extends LessonFrontmatter {
  content: string;
}

const lessonsDir = path.join(process.cwd(), "content", "lessons");

/**
 * Règle éditoriale d'exposition :
 * - En développement : APPROVED et PUBLISHED
 * - En production : uniquement PUBLISHED
 * - Jamais DRAFT, IN_REVIEW ou ARCHIVED en production
 */
function isExposedStatus(status: EditorialStatus): boolean {
  const isProd = process.env.NODE_ENV === "production";
  if (isProd) {
    return status === "PUBLISHED";
  }
  return status === "APPROVED" || status === "PUBLISHED";
}

/**
 * Charge de manière sécurisée tous les fichiers de leçons répertoriés
 */
function loadAllLessonFiles(): LessonDetail[] {
  if (!fs.existsSync(lessonsDir)) {
    return [];
  }

  // Liste contrôlée des fichiers .md uniquement, en ignorant template.md
  const fileNames = fs
    .readdirSync(lessonsDir)
    .filter((f) => f.endsWith(".md") && f !== "template.md");

  const results: LessonDetail[] = [];

  for (const fileName of fileNames) {
    try {
      const filePath = path.join(lessonsDir, fileName);
      const fileContent = fs.readFileSync(filePath, "utf-8");

      const parsed = matter(fileContent, {
        engines: {
          javascript: () => {
            throw new Error("L'exécution de JavaScript dans le frontmatter est strictement interdite.");
          },
        },
      });

      const validated = LessonFrontmatterSchema.safeParse(parsed.data);
      if (validated.success) {
        const data = validated.data;
        if (isExposedStatus(data.editorialStatus)) {
          results.push({
            ...data,
            content: parsed.content,
          });
        }
      } else {
        console.error(
          `[lesson-service] Erreur de validation Zod pour ${fileName}:`,
          validated.error.format()
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[lesson-service] Erreur lors de la lecture de ${fileName}:`, msg);
    }
  }

  return results.sort((a, b) => a.order - b.order);
}

/**
 * Récupère la liste de toutes les leçons (résumés), avec filtre optionnel par école
 */
export function getAllLessons(school?: SchoolType): LessonSummary[] {
  const allDetails = loadAllLessonFiles();
  const filtered = school
    ? allDetails.filter((l) => l.school === school)
    : allDetails;

  return filtered.map((data) => ({
    id: data.id,
    slug: data.slug,
    school: data.school,
    level: data.level,
    order: data.order,
    editorialStatus: data.editorialStatus,
    titleFr: data.titleFr,
    titleAr: data.titleAr,
    summaryFr: data.summaryFr,
    summaryAr: data.summaryAr,
    methodologyPrincipleFr: data.methodologyPrincipleFr,
    methodologyPrincipleAr: data.methodologyPrincipleAr,
    hasQuiz: !!data.quizzes && data.quizzes.length > 0,
  }));
}

/**
 * Récupère les leçons d'une école spécifique
 */
export function getLessonsBySchool(school: SchoolType): LessonSummary[] {
  return getAllLessons(school);
}

/**
 * Récupère une leçon complète par son slug.
 * Ne construit JAMAIS directement un chemin filesystem à partir du slug fourni :
 * charge la liste contrôlée puis recherche l'élément correspondant.
 */
export function getLessonBySlug(slug: string): LessonDetail | null {
  const allDetails = loadAllLessonFiles();
  const found = allDetails.find((l) => l.slug === slug);
  return found || null;
}

/**
 * Récupère les leçons précédente et suivante strictement au sein de la même école
 */
export function getAdjacentLessons(
  school: SchoolType,
  currentSlug: string
): {
  prev: LessonSummary | null;
  next: LessonSummary | null;
} {
  const schoolLessons = getLessonsBySchool(school);
  const currentIndex = schoolLessons.findIndex((l) => l.slug === currentSlug);

  if (currentIndex === -1) {
    return { prev: null, next: null };
  }

  return {
    prev: currentIndex > 0 ? schoolLessons[currentIndex - 1] : null,
    next: currentIndex < schoolLessons.length - 1 ? schoolLessons[currentIndex + 1] : null,
  };
}

/**
 * Résumé du nombre de leçons exposées par école
 */
export function getSchoolCounts(): Record<SchoolType, number> {
  const all = getAllLessons();
  const counts: Record<SchoolType, number> = {
    CRITIQUE: 0,
    HADITH: 0,
    FIQH: 0,
    AQIDA: 0,
  };

  for (const l of all) {
    if (counts[l.school] !== undefined) {
      counts[l.school]++;
    }
  }

  return counts;
}
