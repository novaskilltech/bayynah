import { LearningPathLevel } from "@/types/skills";

/**
 * Définition des 5 paliers canoniques du parcours TABAYYUN
 */
export const LEARNING_PATH_LEVELS: LearningPathLevel[] = [
  {
    levelNumber: 1,
    title: {
      fr: "Niveau 1 — Réflexes critiques fondamentaux",
      ar: "المستوى الأول — اليقظة النقدية التأسيسية",
    },
    description: {
      fr: "Acquérir les premiers réflexes d'immunité intellectuelle : identifier les sophismes d'autorité, le cherry-picking et les erreurs méthodologiques d'évaluation.",
      ar: "بناء الحصانة العقلية الأولى: كشف مغالطة الشهرة وسلطة القائل، ورصد الاجتزاء، وتفادي الانحياز التأكيدي.",
    },
    targetSkills: [
      "BIAS_DETECTION",
      "EPISTEMIC_CAUTION",
      "SOURCE_IDENTIFICATION",
      "CONCLUSION_CALIBRATION",
    ],
    lessonIds: [
      "critique-01-affirmation-vs-preuve",
      "critique-02-hierarchie-sources",
      "critique-03-verifier-avant-transmettre",
      "critique-04-biais-sophismes",
      "critique-05-savoir-dire-je-ne-sais-pas",
    ],
    inquiryIds: ["ablutions-viande-chameau", "cherchez-science-chine"],
    milestoneDescription: {
      fr: "Validation des réflexes critiques et première détection de faux récits.",
      ar: "ضبط أسس التفكير النقدي وتطبيقها على نقد النقول الشائعة.",
    },
  },
  {
    levelNumber: 2,
    title: {
      fr: "Niveau 2 — Critique de la transmission (Hadith)",
      ar: "المستوى الثاني — نقد الرواية والإسناد",
    },
    description: {
      fr: "Maîtriser les règles du takhrīj, l'audit de l'isnād, le jarḥ wa taʿdīl et la critique du matn face aux faux hadiths célèbres.",
      ar: "إتقان مبادئ التخريج، وفحص اتصال السند وعدالة الرواة، ونقد المتن أمام الأحاديث المنتشرة.",
    },
    targetSkills: [
      "AUTHENTICITY_CHECK",
      "PRIMARY_SOURCE_RETRIEVAL",
      "SOURCE_IDENTIFICATION",
      "CONTEXT_ANALYSIS",
    ],
    lessonIds: [
      "hadith-01-matn-isnad",
      "hadith-02-takhrij",
      "hadith-03-degres",
      "hadith-04-critique-chaine",
      "hadith-05-authenticite-vs-istidlal",
    ],
    inquiryIds: ["ikhtilaf-ummati-rahma", "la-adwa-istidlal", "shafii-hadith-madhhab"],
    milestoneDescription: {
      fr: "Capacité à auditer une chaîne de garants et à refuser les décontextualisations.",
      ar: "التمكن من الرجوع إلى كتب الرجال والعلل وتمييز الثابت من الدخيل.",
    },
  },
  {
    levelNumber: 3,
    title: {
      fr: "Niveau 3 — Analyse de l'istidlāl & Uṣūl al-Fiqh",
      ar: "المستوى الثالث — أصول الاستدلال ومنازل الخلاف",
    },
    description: {
      fr: "Auditer les prétentions d'Ijmāʿ, comprendre les sources d'inférence (dalāla), le qiyās et cartographier le khilāf légitime.",
      ar: "تحقيق دعاوى الإجماع، ودراسة مسالك الدلالة، والقياس، وفهم أسباب الخلاف المعتبر.",
    },
    targetSkills: [
      "DALALA_ANALYSIS",
      "IJMA_VERIFICATION",
      "KHILAF_IDENTIFICATION",
      "TERMINOLOGY_ANALYSIS",
    ],
    lessonIds: [
      "fiqh-01-dalil-au-hukm",
      "fiqh-02-dalalat-alfaz",
      "fiqh-03-ijma-jumhur-khilaf",
      "fiqh-04-causes-divergence",
      "fiqh-05-reunir-preuves",
    ],
    inquiryIds: ["toucher-femme-wudu", "ijma-zakat-bijoux"],
    milestoneDescription: {
      fr: "Démontage méthodique des faux consensus et respect des divergences fondées.",
      ar: "القدرة على تمييز الإجماع الصادق من المدعى، وحسن التعامل مع الخلاف الفقهي.",
    },
  },
  {
    levelNumber: 4,
    title: {
      fr: "Niveau 4 — Cohérence doctrinale & Herméneutique (ʿAqīda)",
      ar: "المستوى الرابع — الضبط العقدي والمنهج الاستقرائي",
    },
    description: {
      fr: "Pratiquer le rassemblement des textes (Jamʿ Nuṣūṣ al-Bāb), vérifier les attributions collectives aux Salaf et distinguer muḥkam et mutashābih.",
      ar: "تطبيق قاعدة جمع نصوص الباب، والتحقق الإسنادي من العزو إلى السلف، ورد المتشابه إلى المحكم.",
    },
    targetSkills: [
      "EVIDENCE_AGGREGATION",
      "SALAF_ATTRIBUTION",
      "TEXT_MEANING",
      "EPISTEMIC_CAUTION",
    ],
    lessonIds: [
      "aqida-01-manhaj-talaqqi-istidlal",
      "aqida-02-aql-naql",
      "aqida-03-fahm-salaf",
      "aqida-04-jam-nusus-bab",
      "aqida-05-alfaz-mujmala-muhdatha",
    ],
    inquiryIds: ["salaf-iman-parole-acte", "allah-pardonne-tous-peches"],
    milestoneDescription: {
      fr: "Refus de l'isolationnisme verset par verset et traçabilité historique des dogmes.",
      ar: "الحصانة من التجزئة النصية والتوثيق المحكم لمذاهب السلف وأئمة الإسلام.",
    },
  },
  {
    levelNumber: 5,
    title: {
      fr: "Niveau 5 — Laboratoire transversal & Synthèse",
      ar: "المستوى الخامس — الإتقان المنهجي والتحقيق الشامل",
    },
    description: {
      fr: "Mobiliser les 10 maillons de la méthode TABAYYUN dans une enquête complexe et réussir l'évaluation finale de transfert.",
      ar: "تشغيل سلسلة الضوابط العشرة كاملة في نازلة مركبة، واجتياز التقييم النهائي المستقل.",
    },
    targetSkills: [
      "CONCLUSION_CALIBRATION",
      "DALALA_ANALYSIS",
      "TERMINOLOGY_ANALYSIS",
      "EPISTEMIC_CAUTION",
      "EVIDENCE_AGGREGATION",
    ],
    lessonIds: [],
    inquiryIds: ["toute-bidah-egarement"],
    milestoneDescription: {
      fr: "Obtention de l'Attestation de maîtrise méthodologique TABAYYUN.",
      ar: "نيل شهادة الإتقان المنهجي لمختبر تَبَيُّن.",
    },
  },
];

/**
 * Matrice des prérequis conseillés (Recommandations souples et non bloquantes)
 */
export const RECOMMENDED_PREREQUISITES: Record<
  string,
  { lessonIds: string[]; inquiryIds: string[]; reason: { fr: string; ar: string } }
> = {
  // Enquête 03 (Divergence miséricorde)
  "ikhtilaf-ummati-rahma": {
    lessonIds: ["critique-02-hierarchie-sources", "hadith-05-authenticite-vs-istidlal"],
    inquiryIds: ["cherchez-science-chine"],
    reason: {
      fr: "Cette enquête mobilise l'analyse du matn et le refus du sophisme de notoriété.",
      ar: "يرتكز هذا التحقيق على نقد المتون وكشف مغالطة الشهرة المتداولة.",
    },
  },

  // Enquête 05 (Consensus zakāt des bijoux)
  "ijma-zakat-bijoux": {
    lessonIds: ["critique-02-hierarchie-sources", "fiqh-03-ijma-jumhur-khilaf", "fiqh-05-reunir-preuves"],
    inquiryIds: [],
    reason: {
      fr: "Cette enquête vérifie les prétentions d'ijmāʿ et cartographie le khilāf historique.",
      ar: "يقوم هذا التحقيق على شروط الإجماع الأصولية وضبط درجات الخلاف الفقهي.",
    },
  },

  // Enquête 06 (La 'adwa)
  "la-adwa-istidlal": {
    lessonIds: ["critique-03-verifier-avant-transmettre", "hadith-05-authenticite-vs-istidlal", "fiqh-02-dalalat-alfaz"],
    inquiryIds: ["ikhtilaf-ummati-rahma"],
    reason: {
      fr: "Cette enquête apprend à distinguer l'authenticité d'un hadith de la validité de sa déduction.",
      ar: "يتناول هذا المسار التفريق بين صحة الحديث وصحة الاستدلال به ومسألة الجمع.",
    },
  },

  // Enquête 07 (Si le hadith est authentique...)
  "shafii-hadith-madhhab": {
    lessonIds: ["critique-02-hierarchie-sources", "fiqh-01-dalil-au-hukm", "fiqh-04-causes-divergence"],
    inquiryIds: ["la-adwa-istidlal"],
    reason: {
      fr: "Cette enquête analyse la décontextualisation d'une parole d'imam et ses conditions d'uṣūl.",
      ar: "يعالج هذا التحقيق مسألة انتزاع كلام الأئمة من سياقه وشروط تخريج الفروع على الأصول.",
    },
  },

  // Enquête 08 (Les Salaf ont dit...)
  "salaf-iman-parole-acte": {
    lessonIds: ["critique-01-affirmation-vs-preuve", "hadith-01-matn-isnad", "aqida-03-fahm-salaf"],
    inquiryIds: [],
    reason: {
      fr: "Cette enquête enseigne comment auditer une prétention collective attribuée aux Salaf.",
      ar: "يرسخ هذا التحقيق قواعد التوثيق الإسنادي لدعاوى الإجماع المنسوبة للسلف.",
    },
  },

  // Enquête 09 (Allah pardonne tous les péchés)
  "allah-pardonne-tous-peches": {
    lessonIds: ["critique-03-verifier-avant-transmettre", "aqida-04-jam-nusus-bab"],
    inquiryIds: [],
    reason: {
      fr: "Cette enquête applique la règle cardinale de Jamʿ Nuṣūṣ al-Bāb en matière théologique.",
      ar: "يطبق هذا التحقيق القاعدة الكبرى في جمع نصوص الباب لدفع التعارض الظاهري.",
    },
  },

  // Enquête 10 (Toute innovation est égarement)
  "toute-bidah-egarement": {
    lessonIds: ["fiqh-02-dalalat-alfaz", "aqida-04-jam-nusus-bab", "aqida-03-fahm-salaf"],
    inquiryIds: ["ijma-zakat-bijoux", "shafii-hadith-madhhab", "allah-pardonne-tous-peches"],
    reason: {
      fr: "Enquête de synthèse finale mobilisant les 10 maillons de la méthode TABAYYUN.",
      ar: "تحقيق تركيبي ختامي يشغل السلسلة المنهجية الكاملة لمختبر تَبَيُّن.",
    },
  },
};

/**
 * Vérifie l'état des prérequis pour un contenu donné (non-bloquant)
 */
export function checkPrerequisites(
  completedLessonIds: string[],
  completedInquiryIds: string[],
  targetContentId: string
): {
  hasUnmetPrerequisites: boolean;
  missingLessons: string[];
  missingInquiries: string[];
  reason?: { fr: string; ar: string };
} {
  const reqs = RECOMMENDED_PREREQUISITES[targetContentId];
  if (!reqs) {
    return { hasUnmetPrerequisites: false, missingLessons: [], missingInquiries: [] };
  }

  const missingLessons = reqs.lessonIds.filter((id) => !completedLessonIds.includes(id));
  const missingInquiries = reqs.inquiryIds.filter((id) => !completedInquiryIds.includes(id));

  return {
    hasUnmetPrerequisites: missingLessons.length > 0 || missingInquiries.length > 0,
    missingLessons,
    missingInquiries,
    reason: reqs.reason,
  };
}
