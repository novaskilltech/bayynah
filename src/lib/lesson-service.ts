import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { LessonFrontmatterSchema, LessonFrontmatter } from "./schemas/lesson.schema";

export interface LessonSummary {
  id: string;
  slug: string;
  school: string;
  level: number;
  order: number;
  editorialStatus: string;
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
 * Récupère la liste de toutes les leçons (résumés), avec filtre optionnel par école
 */
export function getAllLessons(school?: string): LessonSummary[] {
  if (!fs.existsSync(lessonsDir)) {
    return [];
  }

  const files = fs.readdirSync(lessonsDir).filter((f) => f.endsWith(".md") && f !== "template.md");
  const lessons: LessonSummary[] = [];

  for (const file of files) {
    try {
      const filePath = path.join(lessonsDir, file);
      const fileContent = fs.readFileSync(filePath, "utf-8");
      const parsed = matter(fileContent, {
        engines: {
          javascript: () => {
            throw new Error("JS engines disabled");
          },
        },
      });

      const validated = LessonFrontmatterSchema.safeParse(parsed.data);
      if (validated.success) {
        const data = validated.data;
        if (!school || data.school.toLowerCase() === school.toLowerCase()) {
          lessons.push({
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
          });
        }
      }
    } catch (err: unknown) {
      console.error(`Erreur lors du chargement de la leçon ${file}:`, err);
    }
  }

  return lessons.sort((a, b) => a.order - b.order);
}

/**
 * Récupère une leçon complète par son slug
 */
export function getLessonBySlug(slug: string): LessonDetail | null {
  if (!fs.existsSync(lessonsDir)) {
    return null;
  }

  const files = fs.readdirSync(lessonsDir).filter((f) => f.endsWith(".md") && f !== "template.md");

  for (const file of files) {
    try {
      const filePath = path.join(lessonsDir, file);
      const fileContent = fs.readFileSync(filePath, "utf-8");
      const parsed = matter(fileContent, {
        engines: {
          javascript: () => {
            throw new Error("JS engines disabled");
          },
        },
      });

      if (parsed.data.slug === slug) {
        const validated = LessonFrontmatterSchema.safeParse(parsed.data);
        if (validated.success) {
          return {
            ...validated.data,
            content: parsed.content,
          };
        } else {
          console.error(`Erreur de validation pour ${slug}:`, validated.error.format());
        }
      }
    } catch (err: unknown) {
      console.error(`Erreur lors de la lecture de la leçon ${slug}:`, err);
    }
  }

  return null;
}

/**
 * Récupère les leçons précédente et suivante dans une école
 */
export function getAdjacentLessons(
  school: string,
  currentOrder: number
): { prev: LessonSummary | null; next: LessonSummary | null } {
  const schoolLessons = getAllLessons(school);
  const currentIndex = schoolLessons.findIndex((l) => l.order === currentOrder);

  if (currentIndex === -1) {
    return { prev: null, next: null };
  }

  return {
    prev: currentIndex > 0 ? schoolLessons[currentIndex - 1] : null,
    next: currentIndex < schoolLessons.length - 1 ? schoolLessons[currentIndex + 1] : null,
  };
}

/**
 * Résumé du nombre de leçons par école
 */
export function getSchoolCounts(): Record<string, number> {
  const all = getAllLessons();
  const counts: Record<string, number> = {
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
