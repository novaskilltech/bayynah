# تَبَيُّن (Tabayyun) — Apprendre à vérifier avant d’affirmer

Plateforme pédagogique destinée à développer l’esprit critique dans l’étude de la religion selon la méthodologie d’Ahl as-Sunnah wa-l-Jamâʿa et la compréhension des pieux prédécesseurs (*Salaf*).

## 1. Principe directeur

> **الدليل ← صحة النقل ← صحة الفهم ← صحة الاستدلال ← الحكم**  
> *La preuve → l’authenticité de la transmission → la compréhension correcte → la validité du raisonnement → la conclusion.*

> **صحة الدليل لا تعني صحة الاستدلال**  
> *Une preuve authentique ne signifie pas automatiquement que l’argumentation construite à partir d’elle est correcte.*

---

## 2. Structure du projet

- `content/` : Matière scientifique rédigée en Markdown (Leçons) et JSON (Enquêtes interactives).
- `prisma/` : Schéma de données relationnel PostgreSQL et bilingue.
- `src/lib/schemas/` : Schémas canoniques Zod validant tous les fichiers de contenus.
- `src/dictionaries/` : Dictionnaires statiques bilingues (FR / AR).
- `src/app/[locale]/` : Pages Next.js App Router bilingues avec support LTR / RTL natif.
- `src/types/` : Contrats d'interfaces TypeScript stricts.

---

## 3. Règle d'or scientifique

**Aucune citation entre guillemets ne doit figurer sur le site sans référence précise vérifiable :**
- Ouvrage original
- Numéro de tome et page, ou numéro de hadith
- Éditeur / édition consultée
- Degré d'authenticité et auteur du jugement (s'il s'agit d'un hadith ou d'un athar)
- Mention explicite lorsqu'il s'agit d'une paraphrase pédagogique.
