/**
 * Dictionnaire Canonique du Lexique Méthodologique — TABAYYUN
 * Uṣūl al-Ḥadīth, Uṣūl al-Fiqh, Épistémologie & Gouvernance Scientifique
 *
 * Source unique de vérité : content/glossary/terms.json (validé par l'Integrity Gate)
 */

import termsJson from "../../content/glossary/terms.json";
import { GlossaryTerm, GlossaryCategory } from "./schemas/glossary.schema";

export type { GlossaryTerm, GlossaryCategory };

export const GLOSSARY_TERMS: GlossaryTerm[] = termsJson as GlossaryTerm[];

/**
 * Récupère un terme du glossaire par son identifiant unique
 */
export function getGlossaryTerm(id: string): GlossaryTerm | undefined {
  const normalized = id.toLowerCase().trim();
  return GLOSSARY_TERMS.find((t) => t.id === normalized);
}

/**
 * Récupère tous les termes du glossaire
 */
export function getAllGlossaryTerms(): GlossaryTerm[] {
  return [...GLOSSARY_TERMS];
}

/**
 * Recherche dans le glossaire par mot-clé (FR ou AR)
 */
export function searchGlossary(query: string): GlossaryTerm[] {
  const q = query.toLowerCase().trim();
  if (!q) return getAllGlossaryTerms();

  return GLOSSARY_TERMS.filter(
    (t) =>
      t.id.includes(q) ||
      t.termFr.toLowerCase().includes(q) ||
      t.termAr.includes(q) ||
      t.shortDefinitionFr.toLowerCase().includes(q) ||
      t.shortDefinitionAr.includes(q) ||
      t.analogyFr.toLowerCase().includes(q) ||
      t.analogyAr.includes(q) ||
      t.trapFr.toLowerCase().includes(q) ||
      t.trapAr.includes(q)
  );
}

/**
 * Filtre les termes par catégorie
 */
export function getGlossaryTermsByCategory(category: GlossaryCategory): GlossaryTerm[] {
  return GLOSSARY_TERMS.filter((t) => t.category === category);
}
