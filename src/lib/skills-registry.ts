import { MethodologicalSkill, SkillMetadata } from "@/types/skills";

/**
 * Métadonnées complètes des 14 compétences canoniques TABAYYUN
 */
export const SKILLS_METADATA: Record<MethodologicalSkill, SkillMetadata> = {
  SOURCE_IDENTIFICATION: {
    id: "SOURCE_IDENTIFICATION",
    category: "SOURCES",
    iconName: "BookOpen",
    name: {
      fr: "Identification des sources",
      ar: "توثيق المصادر وعزوها",
    },
    shortDescription: {
      fr: "Identifier l'auteur, l'ouvrage et l'édition d'origine d'un texte.",
      ar: "تعيين صاحب القول والكتاب والطبعة الأصيلة المنقول عنها.",
    },
    longDescription: {
      fr: "Capacité à remonter d'une citation isolée ou d'une prétention à son livre source, son auteur réel, son époque et son édition imprimée vérifiée.",
      ar: "القدرة على الانتقال من النقول المجردة والشائعة إلى كتبها الأصلية وأصحابها الحقيقيين ومطبوعاتها المحققة.",
    },
  },
  PRIMARY_SOURCE_RETRIEVAL: {
    id: "PRIMARY_SOURCE_RETRIEVAL",
    category: "SOURCES",
    iconName: "Search",
    name: {
      fr: "Recours aux sources primaires",
      ar: "الرجوع إلى الأصول الأولى",
    },
    shortDescription: {
      fr: "Consulter directement le manuscrit ou l'ouvrage originel plutôt qu'un relais secondaire.",
      ar: "الرجوع المباشر إلى المصادر الأم وعدم الاكتفاء بالوسائط المتأخرة.",
    },
    longDescription: {
      fr: "Refus de se satisfaire des citations de seconde main, des anthologies tardives ou des partages numériques sans vérification dans le corpus d'origine.",
      ar: "عدم الاكتفاء بالنقول الوسيطة أو المنشورات الرقمية دون الرجوع إلى أمهات الكتب ومظان المسألة الأصلية.",
    },
  },
  AUTHENTICITY_CHECK: {
    id: "AUTHENTICITY_CHECK",
    category: "CRITIQUE_TEXTUELLE",
    iconName: "ShieldCheck",
    name: {
      fr: "Évaluation de l'authenticité (Thubūt)",
      ar: "نقد الثبوت وصحة السند",
    },
    shortDescription: {
      fr: "Auditer la chaîne de transmission (isnād) et le degré d'authenticité.",
      ar: "فحص اتصال السند وعدالة الرواة وضبطهم والحكم على درجة الحديث.",
    },
    longDescription: {
      fr: "Maîtrise des critères de la critique du hadith : examen des transmetteurs (jarḥ wa taʿdīl), continuité de la chaîne (ittiṣāl) et recherche des défauts cachés (ʿilal).",
      ar: "معرفة قواعد المحدثين في فحص الإسناد: عدالة وضبط الرواة، اتصال السلسلة، واستكشاف العلل الخفية والشذوذ.",
    },
  },
  CONTEXT_ANALYSIS: {
    id: "CONTEXT_ANALYSIS",
    category: "CRITIQUE_TEXTUELLE",
    iconName: "Layers",
    name: {
      fr: "Analyse du contexte (Siyāq & Sabab)",
      ar: "فقه السياق وأسباب الورود",
    },
    shortDescription: {
      fr: "Situer une parole dans son contexte textuel immédiat et ses circonstances d'énonciation.",
      ar: "فهم النص في سياقه اللفظي القريب وسبب وروده وملابساته التاريخية.",
    },
    longDescription: {
      fr: "Empêcher le déracinement textuel en étudiant les versets ou phrases qui précèdent et suivent, ainsi que la cause historique d'énonciation (sabab an-nuzūl / sabab al-wurūd).",
      ar: "منع اجتزاء النصوص من خلال فحص ما قبلها وما بعدها، والرجوع إلى سبب النزول أو سبب الورود المفسر للمراد.",
    },
  },
  TEXT_MEANING: {
    id: "TEXT_MEANING",
    category: "CRITIQUE_TEXTUELLE",
    iconName: "FileText",
    name: {
      fr: "Sens propre du texte",
      ar: "تحرير معنى النص اللغوي",
    },
    shortDescription: {
      fr: "Comprendre le vocabulaire et la structure syntaxique dans la langue de la révélation.",
      ar: "فهم مفردات النص وتركيبه اللغوي وفق لسان العرب زمن التنزيل.",
    },
    longDescription: {
      fr: "Analyse sémantique fidèle à la langue arabe classique, évitant les anachronismes conceptuels et les contresens de traduction contemporaine.",
      ar: "التحقيق اللغوي لألفاظ النصوص بعيداً عن التبدلات الدلالية المعاصرة وأخطاء الترجمة الحرفية.",
    },
  },
  EVIDENCE_AGGREGATION: {
    id: "EVIDENCE_AGGREGATION",
    category: "HERMENEUTIQUE",
    iconName: "GitMerge",
    name: {
      fr: "Rassemblement des textes (Jamʿ Nuṣūṣ al-Bāb)",
      ar: "جمع نصوص الباب",
    },
    shortDescription: {
      fr: "Réunir tous les textes authentiques d'un même sujet avant d'en tirer une règle.",
      ar: "استقراء جميع النصوص الصحيحة الواردة في المسألة قبل استنباط الحكم.",
    },
    longDescription: {
      fr: "Application de la règle cardinale des savants : un texte isolé ne fait pas doctrine ; la vérité légale émerge de la convergence et de l'articulation de l'ensemble des textes du chapitre.",
      ar: "تطبيق القاعدة الذهبية: «الحديث إذا لم تجمع طرقه ونصوص بابه لم يتبين فقهه»؛ فلا يُبنى حكم على نص منفرد.",
    },
  },
  DALALA_ANALYSIS: {
    id: "DALALA_ANALYSIS",
    category: "HERMENEUTIQUE",
    iconName: "Compass",
    name: {
      fr: "Audit des modes d'inférence (Dalālah)",
      ar: "تدقيق مسالك الدلالة والأصول",
    },
    shortDescription: {
      fr: "Distinguer général et particulier, absolu et restreint, acte et délaissement (at-tark).",
      ar: "التمييز بين العام والخاص، والمطلق والمقيد، وفقه دلالة الفعل ودلالة الترك.",
    },
    longDescription: {
      fr: "Maîtrise des instruments d'uṣūl al-fiqh : qualification du ʿāmm/khāṣṣ, muṭlaq/muqayyad, mafhūm al-mukhālafa, et distinction rigoureuse des conditions probantes du délaissement prophétique (at-tark).",
      ar: "إعمال أدوات أصول الفقه: تخصيص العام، تقييد المطلق، مفهوم المخالفة، وضوابط الاستدلال بالترك النبوي.",
    },
  },
  KHILAF_IDENTIFICATION: {
    id: "KHILAF_IDENTIFICATION",
    category: "HERMENEUTIQUE",
    iconName: "Split",
    name: {
      fr: "Cartographie du désaccord (Khilāf)",
      ar: "معرفة منازل الخلاف الفقهي",
    },
    shortDescription: {
      fr: "Distinguer la divergence admissible (muʿtabar) de la rupture anormale (shādhdh).",
      ar: "التمييز بين الخلاف السائغ المعتبر وبين الأقوال الشاذة والمصادمة للنصوص.",
    },
    longDescription: {
      fr: "Capacité à reconnaître les positions contradictoires légitimes fondées sur des lectures différentes des preuves, sans transformer un ijtihād respectable en hérésie.",
      ar: "إدراك تنوع مدارك الفقهاء وفهم أسباب اختلافهم المشروعة دون تسفيه الآراء الاجتهادية المعتبرة.",
    },
  },
  SALAF_ATTRIBUTION: {
    id: "SALAF_ATTRIBUTION",
    category: "SOURCES",
    iconName: "Users",
    name: {
      fr: "Vérification des attributions aux Salaf",
      ar: "تحقيق العزو إلى السلف",
    },
    shortDescription: {
      fr: "Vérifier la chaîne et la réalité d'une parole collective attribuée aux Compagnons ou Tābiʿīn.",
      ar: "التثبت من صحة الآثار المروية عن الصحابة والتابعين قبل نسبة المذهب إليهم.",
    },
    longDescription: {
      fr: "Exiger des chaînes de transmission authentiques (āthār musnadah) pour toute affirmation disant « les Salaf ont dit », et refuser les attributions génériques invérifiables.",
      ar: "إخضاع دعاوى «قال السلف» للتحقيق الإسنادي في مصنفات الآثار (كابن أبي شيبة وعبد الرزاق واللالكائي).",
    },
  },
  IJMA_VERIFICATION: {
    id: "IJMA_VERIFICATION",
    category: "HERMENEUTIQUE",
    iconName: "CheckCircle",
    name: {
      fr: "Audit des prétentions d'Ijmāʿ",
      ar: "تحقيق دعاوى الإجماع",
    },
    shortDescription: {
      fr: "Vérifier si un prétendu consensus n'est pas en réalité une simple position majoritaire contestée.",
      ar: "فحص صحة الإجماع المنقول وتمييزه عن مجرد قول الأكثر أو انعدام العلم بالمخالف.",
    },
    longDescription: {
      fr: "Application de la mise en garde des imams (Aḥmad, Ibn al-Mundhir) : distinguer le consensus formel certain du simple fait de ne pas avoir trouvé de contradicteur immédiat.",
      ar: "تطبيق منهج المحققين (كأحمد وابن المنذر وابن عبد البر): التمييز بين الإجماع القطعي وبين ادعائه في مسائل الخلاف المستقر.",
    },
  },
  EPISTEMIC_CAUTION: {
    id: "EPISTEMIC_CAUTION",
    category: "POSTURE_EPISTEMIQUE",
    iconName: "HelpCircle",
    name: {
      fr: "Prudence épistémique (Tawaqquf)",
      ar: "التوقف والورع العلمي",
    },
    shortDescription: {
      fr: "Savoir suspendre son jugement lorsque les preuves sont insuffisantes ou contradictoires.",
      ar: "القدرة على التوقف وعدم الجزم عند تكافؤ الأدلة أو نقص المادة العلمية.",
    },
    longDescription: {
      fr: "Refus du dogmatisme précipité : reconnaître les limites de ce qui est prouvé et assumer de dire « les données actuelles ne permettent pas de trancher catégoriquement ».",
      ar: "توطين النفس على القول بـ«لا أدري» أو «المسألة تحتمل الأمرين» عند غياب الدليل القاطع؛ والابتعاد عن التكلف.",
    },
  },
  CONCLUSION_CALIBRATION: {
    id: "CONCLUSION_CALIBRATION",
    category: "POSTURE_EPISTEMIQUE",
    iconName: "Scale",
    name: {
      fr: "Proportionnalité de la conclusion",
      ar: "صياغة الحكم بقدر الدليل",
    },
    shortDescription: {
      fr: "Formuler un jugement exactement calibré sur la force probante des éléments disponibles.",
      ar: "ضبط العبارة والنتيجة بحيث تطابق تماماً قوة الدليل دون زيادة أو مبالغة.",
    },
    longDescription: {
      fr: "Interdiction d'énoncer une certitude absolue à partir d'un indice probable, ou de qualifier un acte de péché capital sur la base d'un texte spéculatif.",
      ar: "إعطاء كل مسألة رتبتها: الظني يبقى ظنياً، والقطعي يبقى قطعياً؛ وصيانة اللسان من الجزم بما لم يجزم به الشرع.",
    },
  },
  BIAS_DETECTION: {
    id: "BIAS_DETECTION",
    category: "POSTURE_EPISTEMIQUE",
    iconName: "AlertTriangle",
    name: {
      fr: "Détection des sophismes et biais",
      ar: "كشف المغالطات والانحيازات",
    },
    shortDescription: {
      fr: "Identifier le cherry-picking, l'argument d'autorité, le faux dilemme et la décontextualisation.",
      ar: "رصد الاجتزاء والانتقائية، ومغالطة الاحتجاج بالشهرة، والتعسف في الاستدلال.",
    },
    longDescription: {
      fr: "Sensibilité critique aux pièges du débat : repérer quand un interlocuteur isole une citation, confond notoriété et vérité, ou élude les contre-preuves évidentes.",
      ar: "اليقظة العقلية تجاه حيل الجدل: كالانتقاء المغرض للأدلة، وتحويل الخلاف السائغ إلى صراع، والتلاعب بدلالات الألفاظ.",
    },
  },
  TERMINOLOGY_ANALYSIS: {
    id: "TERMINOLOGY_ANALYSIS",
    category: "HERMENEUTIQUE",
    iconName: "Type",
    name: {
      fr: "Analyse terminologique (Lā Mushāḥḥata)",
      ar: "تحرير الاصطلاح (لا مشاحة في الاصطلاح)",
    },
    shortDescription: {
      fr: "Distinguer le sens linguistique, l'usage légal et les conventions techniques des écoles.",
      ar: "التمييز بين الحقيقة اللغوية والشرعية والاصطلاحية وقاعدة «لا مشاحة في الاصطلاح».",
    },
    longDescription: {
      fr: "Éviter les faux conflits issus d'usages terminologiques différents : comprendre que deux savants peuvent employer un même mot avec des définitions distinctes sans divergence de fond.",
      ar: "فض النزاعات اللفظية الوهمية؛ وفهم أن تباين التسميات بين الأئمة لا يعني بالضرورة تناقضاً في حقيقة الحكم الشرعي.",
    },
  },
};

/**
 * Matrice de correspondance centrale des 20 Leçons vers les Compétences
 */
export const LESSON_SKILLS_MAP: Record<string, MethodologicalSkill[]> = {
  // Esprit Critique (C01 - C05)
  "critique-01-affirmation-vs-preuve": ["BIAS_DETECTION", "EPISTEMIC_CAUTION", "CONCLUSION_CALIBRATION"],
  "critique-02-hierarchie-sources": ["BIAS_DETECTION", "SOURCE_IDENTIFICATION", "PRIMARY_SOURCE_RETRIEVAL"],
  "critique-03-verifier-avant-transmettre": ["AUTHENTICITY_CHECK", "SOURCE_IDENTIFICATION", "EPISTEMIC_CAUTION"],
  "critique-04-biais-sophismes": ["BIAS_DETECTION", "EPISTEMIC_CAUTION", "CONCLUSION_CALIBRATION"],
  "critique-05-savoir-dire-je-ne-sais-pas": ["EPISTEMIC_CAUTION", "CONCLUSION_CALIBRATION"],

  // Hadith (H01 - H05)
  "hadith-01-matn-isnad": ["AUTHENTICITY_CHECK", "SOURCE_IDENTIFICATION"],
  "hadith-02-takhrij": ["PRIMARY_SOURCE_RETRIEVAL", "SOURCE_IDENTIFICATION", "AUTHENTICITY_CHECK"],
  "hadith-03-degres": ["AUTHENTICITY_CHECK", "EPISTEMIC_CAUTION"],
  "hadith-04-critique-chaine": ["AUTHENTICITY_CHECK", "PRIMARY_SOURCE_RETRIEVAL", "BIAS_DETECTION"],
  "hadith-05-authenticite-vs-istidlal": ["TEXT_MEANING", "CONTEXT_ANALYSIS", "DALALA_ANALYSIS"],

  // Fiqh & Uṣūl (F01 - F05)
  "fiqh-01-dalil-au-hukm": ["SOURCE_IDENTIFICATION", "DALALA_ANALYSIS", "PRIMARY_SOURCE_RETRIEVAL"],
  "fiqh-02-dalalat-alfaz": ["DALALA_ANALYSIS", "TEXT_MEANING", "CONCLUSION_CALIBRATION"],
  "fiqh-03-ijma-jumhur-khilaf": ["IJMA_VERIFICATION", "KHILAF_IDENTIFICATION", "EPISTEMIC_CAUTION"],
  "fiqh-04-causes-divergence": ["KHILAF_IDENTIFICATION", "DALALA_ANALYSIS", "EPISTEMIC_CAUTION"],
  "fiqh-05-reunir-preuves": ["EVIDENCE_AGGREGATION", "DALALA_ANALYSIS", "CONCLUSION_CALIBRATION"],

  // ʿAqīda (A01 - A05)
  "aqida-01-manhaj-talaqqi-istidlal": ["SOURCE_IDENTIFICATION", "EPISTEMIC_CAUTION", "DALALA_ANALYSIS"],
  "aqida-02-aql-naql": ["DALALA_ANALYSIS", "TEXT_MEANING", "EPISTEMIC_CAUTION"],
  "aqida-03-fahm-salaf": ["SALAF_ATTRIBUTION", "SOURCE_IDENTIFICATION", "AUTHENTICITY_CHECK"],
  "aqida-04-jam-nusus-bab": ["EVIDENCE_AGGREGATION", "CONTEXT_ANALYSIS", "CONCLUSION_CALIBRATION"],
  "aqida-05-alfaz-mujmala-muhdatha": ["TERMINOLOGY_ANALYSIS", "TEXT_MEANING", "BIAS_DETECTION"],
};

/**
 * Matrice de correspondance centrale des 10 Enquêtes (par étape 1..10) vers les Compétences
 */
export const INQUIRY_STEP_SKILLS_MAP: Record<string, Record<number, MethodologicalSkill[]>> = {
  // E01 : Chameau & ablutions (FIQH / KHILAF)
  "ablutions-viande-chameau": {
    1: ["SOURCE_IDENTIFICATION", "AUTHENTICITY_CHECK"],
    2: ["AUTHENTICITY_CHECK", "PRIMARY_SOURCE_RETRIEVAL"],
    3: ["EVIDENCE_AGGREGATION", "CONTEXT_ANALYSIS"],
    4: ["DALALA_ANALYSIS", "TEXT_MEANING"],
    5: ["DALALA_ANALYSIS", "TERMINOLOGY_ANALYSIS"],
    6: ["KHILAF_IDENTIFICATION", "EPISTEMIC_CAUTION"],
    7: ["KHILAF_IDENTIFICATION", "CONCLUSION_CALIBRATION"],
    8: ["EPISTEMIC_CAUTION", "CONCLUSION_CALIBRATION"],
    9: ["CONCLUSION_CALIBRATION", "BIAS_DETECTION"],
    10: ["CONCLUSION_CALIBRATION", "EPISTEMIC_CAUTION"],
  },

  // E02 : Cherchez la science en Chine (HADITH / ISNAD)
  "cherchez-science-chine": {
    1: ["SOURCE_IDENTIFICATION", "BIAS_DETECTION"],
    2: ["PRIMARY_SOURCE_RETRIEVAL", "SOURCE_IDENTIFICATION"],
    3: ["AUTHENTICITY_CHECK", "PRIMARY_SOURCE_RETRIEVAL"],
    4: ["AUTHENTICITY_CHECK", "SOURCE_IDENTIFICATION"],
    5: ["AUTHENTICITY_CHECK", "BIAS_DETECTION"],
    6: ["AUTHENTICITY_CHECK", "CONCLUSION_CALIBRATION"],
    7: ["TEXT_MEANING", "DALALA_ANALYSIS"],
    8: ["EPISTEMIC_CAUTION", "CONCLUSION_CALIBRATION"],
    9: ["CONCLUSION_CALIBRATION", "BIAS_DETECTION"],
    10: ["CONCLUSION_CALIBRATION", "AUTHENTICITY_CHECK"],
  },

  // E03 : Divergence miséricorde (HADITH / MATN)
  "ikhtilaf-ummati-rahma": {
    1: ["SOURCE_IDENTIFICATION", "BIAS_DETECTION"],
    2: ["PRIMARY_SOURCE_RETRIEVAL", "SOURCE_IDENTIFICATION"],
    3: ["AUTHENTICITY_CHECK", "PRIMARY_SOURCE_RETRIEVAL"],
    4: ["AUTHENTICITY_CHECK", "EPISTEMIC_CAUTION"],
    5: ["TEXT_MEANING", "DALALA_ANALYSIS"],
    6: ["EVIDENCE_AGGREGATION", "CONTEXT_ANALYSIS"],
    7: ["KHILAF_IDENTIFICATION", "DALALA_ANALYSIS"],
    8: ["EPISTEMIC_CAUTION", "CONCLUSION_CALIBRATION"],
    9: ["CONCLUSION_CALIBRATION", "BIAS_DETECTION"],
    10: ["CONCLUSION_CALIBRATION", "AUTHENTICITY_CHECK"],
  },

  // E04 : Toucher une femme & ablutions (FIQH / USUL)
  "toucher-femme-wudu": {
    1: ["SOURCE_IDENTIFICATION", "TEXT_MEANING"],
    2: ["TEXT_MEANING", "DALALA_ANALYSIS"],
    3: ["EVIDENCE_AGGREGATION", "CONTEXT_ANALYSIS"],
    4: ["DALALA_ANALYSIS", "TEXT_MEANING"],
    5: ["DALALA_ANALYSIS", "TERMINOLOGY_ANALYSIS"],
    6: ["KHILAF_IDENTIFICATION", "DALALA_ANALYSIS"],
    7: ["KHILAF_IDENTIFICATION", "EPISTEMIC_CAUTION"],
    8: ["EPISTEMIC_CAUTION", "CONCLUSION_CALIBRATION"],
    9: ["CONCLUSION_CALIBRATION", "BIAS_DETECTION"],
    10: ["CONCLUSION_CALIBRATION", "DALALA_ANALYSIS"],
  },

  // E05 : Consensus zakāt des bijoux (FIQH / IJMA)
  "ijma-zakat-bijoux": {
    1: ["IJMA_VERIFICATION", "BIAS_DETECTION"],
    2: ["PRIMARY_SOURCE_RETRIEVAL", "IJMA_VERIFICATION"],
    3: ["IJMA_VERIFICATION", "KHILAF_IDENTIFICATION"],
    4: ["KHILAF_IDENTIFICATION", "EPISTEMIC_CAUTION"],
    5: ["EVIDENCE_AGGREGATION", "DALALA_ANALYSIS"],
    6: ["DALALA_ANALYSIS", "KHILAF_IDENTIFICATION"],
    7: ["IJMA_VERIFICATION", "CONCLUSION_CALIBRATION"],
    8: ["EPISTEMIC_CAUTION", "CONCLUSION_CALIBRATION"],
    9: ["CONCLUSION_CALIBRATION", "BIAS_DETECTION"],
    10: ["CONCLUSION_CALIBRATION", "IJMA_VERIFICATION"],
  },

  // E06 : La 'adwa / Pas de contagion (HADITH / ISTIDLAL)
  "la-adwa-istidlal": {
    1: ["AUTHENTICITY_CHECK", "BIAS_DETECTION"],
    2: ["AUTHENTICITY_CHECK", "PRIMARY_SOURCE_RETRIEVAL"],
    3: ["EVIDENCE_AGGREGATION", "CONTEXT_ANALYSIS"],
    4: ["CONTEXT_ANALYSIS", "TEXT_MEANING"],
    5: ["EVIDENCE_AGGREGATION", "DALALA_ANALYSIS"],
    6: ["DALALA_ANALYSIS", "TERMINOLOGY_ANALYSIS"],
    7: ["DALALA_ANALYSIS", "CONCLUSION_CALIBRATION"],
    8: ["BIAS_DETECTION", "EPISTEMIC_CAUTION"],
    9: ["CONCLUSION_CALIBRATION", "EPISTEMIC_CAUTION"],
    10: ["CONCLUSION_CALIBRATION", "EVIDENCE_AGGREGATION"],
  },

  // E07 : Si le hadith est authentique c'est mon madhhab (CRITIQUE / DECONTEXTUALISATION)
  "shafii-hadith-madhhab": {
    1: ["SOURCE_IDENTIFICATION", "BIAS_DETECTION"],
    2: ["PRIMARY_SOURCE_RETRIEVAL", "AUTHENTICITY_CHECK"],
    3: ["CONTEXT_ANALYSIS", "TEXT_MEANING"],
    4: ["DALALA_ANALYSIS", "CONTEXT_ANALYSIS"],
    5: ["DALALA_ANALYSIS", "KHILAF_IDENTIFICATION"],
    6: ["DALALA_ANALYSIS", "TERMINOLOGY_ANALYSIS"],
    7: ["BIAS_DETECTION", "EPISTEMIC_CAUTION"],
    8: ["EPISTEMIC_CAUTION", "CONCLUSION_CALIBRATION"],
    9: ["CONCLUSION_CALIBRATION", "BIAS_DETECTION"],
    10: ["CONCLUSION_CALIBRATION", "DALALA_ANALYSIS"],
  },

  // E08 : Les Salaf ont dit (AQIDA / SALAF)
  "salaf-iman-parole-acte": {
    1: ["SALAF_ATTRIBUTION", "BIAS_DETECTION"],
    2: ["PRIMARY_SOURCE_RETRIEVAL", "SALAF_ATTRIBUTION"],
    3: ["AUTHENTICITY_CHECK", "SALAF_ATTRIBUTION"],
    4: ["SALAF_ATTRIBUTION", "CONTEXT_ANALYSIS"],
    5: ["EVIDENCE_AGGREGATION", "SALAF_ATTRIBUTION"],
    6: ["SALAF_ATTRIBUTION", "AUTHENTICITY_CHECK"],
    7: ["TERMINOLOGY_ANALYSIS", "TEXT_MEANING"],
    8: ["IJMA_VERIFICATION", "SALAF_ATTRIBUTION"],
    9: ["CONCLUSION_CALIBRATION", "EPISTEMIC_CAUTION"],
    10: ["CONCLUSION_CALIBRATION", "SALAF_ATTRIBUTION"],
  },

  // E09 : Allah pardonne tous les péchés (AQIDA / TAFSIR)
  "allah-pardonne-tous-peches": {
    1: ["TEXT_MEANING", "BIAS_DETECTION"],
    2: ["TEXT_MEANING", "PRIMARY_SOURCE_RETRIEVAL"],
    3: ["CONTEXT_ANALYSIS", "TEXT_MEANING"],
    4: ["EVIDENCE_AGGREGATION", "DALALA_ANALYSIS"],
    5: ["EVIDENCE_AGGREGATION", "DALALA_ANALYSIS"],
    6: ["EVIDENCE_AGGREGATION", "TEXT_MEANING"],
    7: ["PRIMARY_SOURCE_RETRIEVAL", "DALALA_ANALYSIS"],
    8: ["BIAS_DETECTION", "EPISTEMIC_CAUTION"],
    9: ["CONCLUSION_CALIBRATION", "EPISTEMIC_CAUTION"],
    10: ["CONCLUSION_CALIBRATION", "EVIDENCE_AGGREGATION"],
  },

  // E10 : Toute innovation est égarement (CRITIQUE / SYNTHESE)
  "toute-bidah-egarement": {
    1: ["BIAS_DETECTION", "TERMINOLOGY_ANALYSIS"],
    2: ["AUTHENTICITY_CHECK", "PRIMARY_SOURCE_RETRIEVAL"],
    3: ["SALAF_ATTRIBUTION", "TERMINOLOGY_ANALYSIS"],
    4: ["PRIMARY_SOURCE_RETRIEVAL", "CONTEXT_ANALYSIS"],
    5: ["CONTEXT_ANALYSIS", "EVIDENCE_AGGREGATION"],
    6: ["DALALA_ANALYSIS", "TERMINOLOGY_ANALYSIS"],
    7: ["TERMINOLOGY_ANALYSIS", "KHILAF_IDENTIFICATION"],
    8: ["DALALA_ANALYSIS", "EPISTEMIC_CAUTION"],
    9: ["CONCLUSION_CALIBRATION", "BIAS_DETECTION"],
    10: ["CONCLUSION_CALIBRATION", "EPISTEMIC_CAUTION"],
  },
};

/**
 * Fonctions d'accès et de consultation de la matrice
 */
export function getSkillsForLesson(lessonSlug: string): MethodologicalSkill[] {
  return LESSON_SKILLS_MAP[lessonSlug] || [];
}

export function getSkillsForInquiryStep(inquirySlug: string, stepNumber: number): MethodologicalSkill[] {
  const inquirySteps = INQUIRY_STEP_SKILLS_MAP[inquirySlug];
  if (!inquirySteps) return [];
  return inquirySteps[stepNumber] || [];
}

export function getLessonsForSkill(skill: MethodologicalSkill): string[] {
  const result: string[] = [];
  for (const [lessonSlug, skills] of Object.entries(LESSON_SKILLS_MAP)) {
    if (skills.includes(skill)) {
      result.push(lessonSlug);
    }
  }
  return result;
}

export function getInquiryStepsForSkill(skill: MethodologicalSkill): { inquirySlug: string; stepNumber: number }[] {
  const result: { inquirySlug: string; stepNumber: number }[] = [];
  for (const [inquirySlug, steps] of Object.entries(INQUIRY_STEP_SKILLS_MAP)) {
    for (const [stepStr, skills] of Object.entries(steps)) {
      if (skills.includes(skill)) {
        result.push({ inquirySlug, stepNumber: Number(stepStr) });
      }
    }
  }
  return result;
}
