import { z } from "zod";

export const GlossaryCategorySchema = z.enum(["hadith", "usul", "epistemology", "governance"]);

export const GlossaryTermSchema = z.object({
  id: z.string().min(2).max(64).regex(/^[a-z0-9-]+$/, "L'identifiant doit être en minuscules avec tirets"),
  termFr: z.string().min(2).max(128),
  termAr: z.string().min(2).max(128),
  category: GlossaryCategorySchema,
  shortDefinitionFr: z.string().min(10).max(500),
  shortDefinitionAr: z.string().min(10).max(500),
  analogyFr: z.string().min(5).max(350),
  analogyAr: z.string().min(5).max(350),
  trapFr: z.string().min(5).max(350),
  trapAr: z.string().min(5).max(350),
  editorialStatus: z.enum(["DRAFT", "IN_REVIEW", "APPROVED", "PUBLISHED", "ARCHIVED"]),
  reviewerId: z.string().min(1),
  reviewedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}/, "Format date YYYY-MM-DD requis"),
  sources: z.array(z.string().min(3)).min(1, "Au moins une source de référence classique requise"),
});

export const GlossaryFileSchema = z.array(GlossaryTermSchema).min(20, "Le lexique doit comporter au moins 20 termes");

export type GlossaryTerm = z.infer<typeof GlossaryTermSchema>;
export type GlossaryCategory = z.infer<typeof GlossaryCategorySchema>;
