/**
 * Chargement Canonique des Contenus Scientifiques (Sanctuaire Git Serveur & GitHub main)
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
import { getGitHubAuthHeader } from "./github-auth";

export interface CanonicalContentResult {
  content: Record<string, unknown>;
  contentHash: string;
  gitBlobSha: string;
  filePath: string;
  rawContent: string;
}

/**
 * Calcule le SHA-1 de blob Git standard : sha1("blob " + size + "\0" + content)
 * Identique au champ `sha` renvoyé par l'API GitHub contents.
 */
export function computeGitBlobSha(content: string | Buffer): string {
  const buf = Buffer.isBuffer(content) ? content : Buffer.from(content, "utf-8");
  const header = `blob ${buf.length}\0`;
  return crypto.createHash("sha1").update(header).update(buf).digest("hex");
}

/**
 * Charge le contenu scientifique canonique depuis le filesystem serveur (Sanctuaire Git local).
 * Utilisé pour le rendu public, la validation de build et le mode local/offline.
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
  const gitBlobSha = computeGitBlobSha(rawContent);

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
    gitBlobSha,
    filePath: targetPath,
    rawContent,
  };
}

/**
 * Charge le contenu scientifique canonique directement depuis la branche GitHub `main`.
 * Source de vérité absolue pour toute proposition de révision scientifique.
 */
export async function getCanonicalScientificContentFromGitHub(
  type: "lesson" | "inquiry",
  slug: string
): Promise<CanonicalContentResult> {
  if (!validateSlug(slug)) {
    throw new Error(`Slug scientifique invalide ou malveillant : "${slug}".`);
  }

  const repoFilePath = `content/${type === "lesson" ? "lessons" : "inquiries"}/${slug}.${type === "lesson" ? "md" : "json"}`;
  const repoOwner = process.env.GITHUB_REPOSITORY_OWNER || "novaskilltech";
  const repoName = process.env.GITHUB_REPOSITORY_NAME || "bayynah";
  const authHeader = await getGitHubAuthHeader();

  if (authHeader) {
    try {
      const res = await fetch(
        `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${repoFilePath}?ref=main`,
        {
          headers: {
            Authorization: authHeader,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );

      if (!res.ok) {
        throw new Error(`Échec récupération fichier GitHub main (${res.status} ${res.statusText})`);
      }

      const data = await res.json();
      const rawContent = Buffer.from(data.content, "base64").toString("utf-8");
      const gitBlobSha = data.sha as string;
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
        gitBlobSha,
        filePath: repoFilePath,
        rawContent,
      };
    } catch (err: unknown) {
      if (process.env.NODE_ENV === "production") {
        throw new Error(
          `Impossible de charger le contenu canonique depuis GitHub main en production : ${
            err instanceof Error ? err.message : String(err)
          }`
        );
      }
      // En dev/test : repli sur le filesystem local avec calcul de Git blob SHA
      return getCanonicalScientificContent(type, slug);
    }
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Configuration GitHub manquante en production : impossible de récupérer le contenu canonique depuis main."
    );
  }

  // En dev/test : repli sur le filesystem local avec calcul de Git blob SHA
  return getCanonicalScientificContent(type, slug);
}
