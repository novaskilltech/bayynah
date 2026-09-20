import fs from "fs";
import path from "path";
import { InquirySchema, InquiryInput } from "./schemas/inquiry.schema";

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
 * Récupère la liste de toutes les enquêtes disponibles (résumés)
 */
export function getAllInquiries(): InquirySummary[] {
  if (!fs.existsSync(inquiriesDir)) {
    return [];
  }

  const files = fs.readdirSync(inquiriesDir).filter((f) => f.endsWith(".json"));
  const summaries: InquirySummary[] = [];

  for (const file of files) {
    try {
      const filePath = path.join(inquiriesDir, file);
      const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      const parsed = InquirySchema.safeParse(content);

      if (parsed.success) {
        const inq = parsed.data;
        summaries.push({
          id: inq.id,
          slug: inq.slug,
          domain: inq.domain,
          editorialStatus: inq.editorialStatus,
          title: inq.title,
          initialClaim: inq.initialClaim,
          certaintyLevel: inq.conclusionSheet.certaintyLevel,
          stepsCount: inq.steps.length,
          evidencesCount: inq.inquiryEvidences.length,
        });
      }
    } catch (err) {
      console.error(`Erreur lors du chargement de l'enquête ${file}:`, err);
    }
  }

  return summaries;
}

/**
 * Récupère une enquête complète par son slug
 */
export function getInquiryBySlug(slug: string): InquiryInput | null {
  if (!fs.existsSync(inquiriesDir)) {
    return null;
  }

  const files = fs.readdirSync(inquiriesDir).filter((f) => f.endsWith(".json"));

  for (const file of files) {
    try {
      const filePath = path.join(inquiriesDir, file);
      const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));

      if (content.slug === slug) {
        const parsed = InquirySchema.safeParse(content);
        if (parsed.success) {
          return parsed.data;
        } else {
          console.error(`Erreur de validation Zod pour ${slug}:`, parsed.error.format());
        }
      }
    } catch (err) {
      console.error(`Erreur lors de la lecture de l'enquête ${slug}:`, err);
    }
  }

  return null;
}
