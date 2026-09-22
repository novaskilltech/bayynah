export const VALID_LESSON_SLUGS = [
  "aqida-01-manhaj-talaqqi-istidlal",
  "aqida-02-aql-naql",
  "aqida-03-fahm-salaf",
  "aqida-04-jam-nusus-bab",
  "aqida-05-alfaz-mujmala-muhdatha",
  "critique-01-affirmation-vs-preuve",
  "critique-02-hierarchie-sources",
  "critique-03-verifier-avant-transmettre",
  "critique-04-biais-sophismes",
  "critique-05-savoir-dire-je-ne-sais-pas",
  "fiqh-01-dalil-au-hukm",
  "fiqh-02-dalalat-alfaz",
  "fiqh-03-ijma-jumhur-khilaf",
  "fiqh-04-causes-divergence",
  "fiqh-05-reunir-preuves",
  "hadith-01-matn-isnad",
  "hadith-02-takhrij",
  "hadith-03-degres",
  "hadith-04-critique-chaine",
  "hadith-05-authenticite-vs-istidlal",
] as const;

export const VALID_INQUIRY_IDS = [
  "inquiry-01",
  "inquiry-02",
  "inquiry-03",
  "inquiry-04",
  "inquiry-05",
  "inquiry-06",
  "inquiry-07",
  "inquiry-08",
  "inquiry-09",
  "inquiry-10",
] as const;

export const VALID_INQUIRY_SLUGS = [
  "ablutions-viande-chameau",
  "cherchez-science-chine",
  "ikhtilaf-ummati-rahma",
  "toucher-femme-wudu",
  "ijma-zakat-bijoux",
  "la-adwa-istidlal",
  "shafii-hadith-madhhab",
  "salaf-iman-parole-acte",
  "allah-pardonne-tous-peches",
  "toute-bidah-egarement",
] as const;

export const VALID_INQUIRY_IDS_AND_SLUGS = [
  ...VALID_INQUIRY_IDS,
  ...VALID_INQUIRY_SLUGS,
] as const;

export const VALID_GLOSSARY_TERM_IDS = [
  "dalala",
  "takrij",
  "jam",
  "tarjih",
  "ijma",
  "tawaqquf",
  "matn",
  "isnad",
  "qat-i",
  "zanni",
  "tawatur",
  "ahad",
  "shadh",
  "mu-allal",
  "illah",
  "qiyas",
  "ihtimal",
  "istidlal",
  "muhkam",
  "mutashabih",
  "to-be-checked",
  "verified-verbatim",
  "verified-paraphrase",
  "falsifiabilite",
  "biais-confirmation",
] as const;

export const CANONICAL_SCHOOLS = ["CRITIQUE", "HADITH", "FIQH", "AQIDA"] as const;
export const CANONICAL_CERTAINTY_LEVELS = [
  "ETABLI",
  "FORTEMENT_ETABLI",
  "KHILAF_RECONNU",
  "EXPERTISE_REQUISE",
  "INSUFFISANT",
] as const;

export type LessonSlug = (typeof VALID_LESSON_SLUGS)[number];
export type InquiryId = (typeof VALID_INQUIRY_IDS)[number];
export type InquiryResourceId = (typeof VALID_INQUIRY_IDS_AND_SLUGS)[number];
export type GlossaryTermId = (typeof VALID_GLOSSARY_TERM_IDS)[number];

export function isLessonSlug(value: string): value is LessonSlug {
  return (VALID_LESSON_SLUGS as readonly string[]).includes(value);
}

export function isInquiryId(value: string): value is InquiryId {
  return (VALID_INQUIRY_IDS as readonly string[]).includes(value);
}

export function isGlossaryTermId(value: string): value is GlossaryTermId {
  return (VALID_GLOSSARY_TERM_IDS as readonly string[]).includes(value);
}
