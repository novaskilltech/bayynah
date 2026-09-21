import fs from "fs";
import path from "path";
import { InquirySchema, InquiryInput } from "./schemas/inquiry.schema";
import { EditorialStatus } from "./schemas/lesson.schema";

export interface InquirySummary {
  id: string;
  slug: string;
  domain: string;
  editorialStatus: string;
  title: {
    fr: string;
    ar: string;
  };
  initialClaim: {
    fr: string;
    ar: string;
  };
  certaintyLevel: string;
  stepsCount: number;
  evidencesCount: number;
}

const inquiriesDir = path.join(process.cwd(), "content", "inquiries");

/**
 * Règle éditoriale d'exposition :
 * - En développement : APPROVED et PUBLISHED
 * - En production : uniquement PUBLISHED
 * - Jamais DRAFT, IN_REVIEW ou ARCHIVED en production
 */
function isExposedStatus(status: EditorialStatus | string): boolean {
  const isProd = process.env.NODE_ENV === "production";
  if (isProd) {
    return status === "PUBLISHED";
  }
  return status === "APPROVED" || status === "PUBLISHED";
}

/**
 * Charge de manière sécurisée toutes les enquêtes exposées
 */
function loadAllInquiryFiles(): InquiryInput[] {
  if (!fs.existsSync(inquiriesDir)) {
    return [];
  }

  const files = fs
    .readdirSync(inquiriesDir)
    .filter((f) => f.endsWith(".json") && !f.startsWith("template"));

  const results: InquiryInput[] = [];

  for (const file of files) {
    try {
      const filePath = path.join(inquiriesDir, file);
      const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      const parsed = InquirySchema.safeParse(content);

      if (parsed.success) {
        const inq = parsed.data;
        if (isExposedStatus(inq.editorialStatus)) {
          results.push(inq);
        }
      } else {
        console.error(`[inquiry-service] Erreur de validation Zod pour ${file}:`, parsed.error.format());
      }
    } catch (err) {
      console.error(`[inquiry-service] Erreur lors du chargement de l'enquête ${file}:`, err);
    }
  }

  return results;
}

/**
 * Récupère la liste de toutes les enquêtes disponibles (résumés)
 */
export function getAllInquiries(): InquirySummary[] {
  const inquiries = loadAllInquiryFiles();
  return inquiries.map((inq) => ({
    id: inq.id,
    slug: inq.slug,
    domain: inq.domain,
    editorialStatus: inq.editorialStatus,
    title: inq.title,
    initialClaim: inq.initialClaim,
    certaintyLevel: inq.conclusionSheet.certaintyLevel,
    stepsCount: inq.steps.length,
    evidencesCount: inq.inquiryEvidences.length,
  }));
}

/**
 * Récupère une enquête complète par son slug.
 * Whitelist-based : charge la liste des enquêtes autorisées et recherche le slug correspondant.
 */
export function getInquiryBySlug(slug: string): InquiryInput | null {
  const inquiries = loadAllInquiryFiles();
  const found = inquiries.find((inq) => inq.slug === slug);
  return found || null;
}
