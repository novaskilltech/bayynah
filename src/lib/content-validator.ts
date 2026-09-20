import fs from "fs";
import path from "path";
import { LessonFrontmatterSchema } from "./schemas/lesson.schema";
import { InquirySchema } from "./schemas/inquiry.schema";

/**
 * Validateur de contenu Tabayyun
 * Scanne content/lessons et content/inquiries et valide chaque fichier contre son schéma Zod.
 */
export function validateAllContent(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const lessonsDir = path.join(process.cwd(), "content", "lessons");
  const inquiriesDir = path.join(process.cwd(), "content", "inquiries");

  // 1. Valider les leçons
  if (fs.existsSync(lessonsDir)) {
    const files = fs.readdirSync(lessonsDir).filter((f) => f.endsWith(".md"));
    for (const file of files) {
      const filePath = path.join(lessonsDir, file);
      const content = fs.readFileSync(filePath, "utf-8");
      
      // Extraction rudimentaire du frontmatter YAML
      const match = content.match(/^---\r?\n([\s\S]+?)\r?\n---/);
      if (!match) {
        errors.push(`[Leçon ${file}] Frontmatter YAML manquant ou mal formé.`);
        continue;
      }

      try {
        const yamlText = match[1];
        // Parse basique des lignes YAML clés-valeurs simples
        const parsed: Record<string, any> = {};
        let currentKey = "";
        
        for (const line of yamlText.split(/\r?\n/)) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) continue;
          
          const kvMatch = line.match(/^([a-zA-Z0-9_]+):\s*(.*)$/);
          if (kvMatch && !line.startsWith("  ")) {
            currentKey = kvMatch[1];
            let val: any = kvMatch[2].trim();
            // Nettoyer les guillemets
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            } else if (val === "true") val = true;
            else if (val === "false") val = false;
            else if (!isNaN(Number(val)) && val !== "") val = Number(val);
            parsed[currentKey] = val;
          }
        }

        const result = LessonFrontmatterSchema.safeParse(parsed);
        if (!result.success) {
          errors.push(`[Leçon ${file}] Erreur de validation Zod:\n` + JSON.stringify(result.error.format(), null, 2));
        }
      } catch (err: any) {
        errors.push(`[Leçon ${file}] Erreur de parsing : ${err.message}`);
      }
    }
  }

  // 2. Valider les enquêtes
  if (fs.existsSync(inquiriesDir)) {
    const files = fs.readdirSync(inquiriesDir).filter((f) => f.endsWith(".json"));
    for (const file of files) {
      const filePath = path.join(inquiriesDir, file);
      try {
        const jsonContent = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        const result = InquirySchema.safeParse(jsonContent);
        if (!result.success) {
          errors.push(`[Enquête ${file}] Erreur de validation Zod:\n` + JSON.stringify(result.error.format(), null, 2));
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
    console.error("❌ Échec de validation des contenus scientifiques :");
    errors.forEach((e) => console.error(e));
    process.exit(1);
  } else {
    console.log("✅ Tous les contenus scientifiques respectent scrupuleusement les schémas Zod.");
  }
}
