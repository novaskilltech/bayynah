# تَبَيُّن (Bayynah) — Apprendre à vérifier avant d’affirmer

Plateforme pédagogique destinée à développer l’esprit critique dans l’étude de la religion selon la méthodologie d’Ahl as-Sunnah wa-l-Jamâʿa et la compréhension des pieux prédécesseurs (*Salaf*).

## 1. Principe directeur

> **الدليل ← صحة النقل ← صحة الفهم ← صحة الاستدلال ← الحكم**  
> *La preuve → l’authenticité de la transmission → la compréhension correcte → la validité du raisonnement → la conclusion.*

> **صحة الدليل لا تعني صحة الاستدلال**  
> *Une preuve authentique ne signifie pas automatiquement que l’argumentation construite à partir d’elle est correcte.*

## 2. Structure du projet

- `content/` : Matière scientifique rédigée en Markdown (Leçons) et JSON (Enquêtes interactives).
- `prisma/` : Schéma de données PostgreSQL relationnel et bilingue.
- `src/app/[locale]/` : Pages Next.js 14 App Router avec support bilingue (Français LTR / Arabe RTL).
- `src/types/` : Contrats d'interfaces TypeScript stricts.

## 3. Contribution scientifique

Pour rédiger une nouvelle leçon ou enquête, consultez les gabarits :
- `content/lessons/template.md`
- `content/inquiries/template.json`
