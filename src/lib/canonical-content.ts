/**
 * Chargement Canonique des Contenus Scientifiques (Sanctuaire Git Serveur)
 * TABAYYUN — Gouvernance Scientifique
 *
 * Ce module s'exécute exclusivement côté serveur (Node.js runtime).
 * Il garantit l'étanchéité du filesystem et l'intégrité des contenus de référence.
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import matter from "gray-matter";
import { validateSlug } from "./scientific-governance";

export interface CanonicalContentResult {
  content: Record<string, unknown>;
  contentHash: string;
  filePath: string;
  rawContent: string;
}

/**
 * Charge le contenu scientifique canonique depuis le filesystem serveur (Sanctuaire Git).
 * Ne fait JAMAIS confiance au contenu original fourni par le client.
 */
export function getCanonicalScientificContent(
  type: "lesson" | "inquiry",
  slug: string
): CanonicalContentResult {
  if (!validateSlug(slug)) {
    throw new Error(`Slug scientifique invalide ou malveillant : "${slug}".`);
  }

  const baseDir = path.resolve(process.cwd(), "content", type === "lesson" ? "lessons" : "inquiries");
  const extension = type === "lesson" ? ".md" : ".json";
  const targetPath = path.resolve(baseDir, `${slug}${extension}`);

  // Anti-traversal guard
  if (!targetPath.startsWith(baseDir + path.sep)) {
    throw new Error(`Tentative de path traversal détectée pour le slug : "${slug}".`);
  }

  if (!fs.existsSync(targetPath)) {
    throw new Error(`Contenu scientifique introuvable : ${type}/${slug}`);
  }

  const rawContent = fs.readFileSync(targetPath, "utf-8");
  const contentHash = crypto.createHash("sha256").update(rawContent).digest("hex");

  let content: Record<string, unknown>;
  if (type === "lesson") {
    const parsed = matter(rawContent);
    content = { ...parsed.data, contentFr: parsed.content };
  } else {
    content = JSON.parse(rawContent);
  }

  return {
    content,
    contentHash,
    filePath: targetPath,
    rawContent,
  };
}
