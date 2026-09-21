import {
  MethodologicalSkill,
  SkillLevel,
  SkillAttempt,
  SkillMastery,
  MethodologicalProfile,
  IdentifiedMethodologicalPattern,
} from "@/types/skills";

const ALL_SKILLS: MethodologicalSkill[] = [
  "SOURCE_IDENTIFICATION",
  "PRIMARY_SOURCE_RETRIEVAL",
  "AUTHENTICITY_CHECK",
  "CONTEXT_ANALYSIS",
  "TEXT_MEANING",
  "EVIDENCE_AGGREGATION",
  "DALALA_ANALYSIS",
  "KHILAF_IDENTIFICATION",
  "SALAF_ATTRIBUTION",
  "IJMA_VERIFICATION",
  "EPISTEMIC_CAUTION",
  "CONCLUSION_CALIBRATION",
  "BIAS_DETECTION",
  "TERMINOLOGY_ANALYSIS",
];

/**
 * Calcule le score pondéré d'une tentative unitaire (0 à 100)
 * Règle d'or : BEST immédiat (1er essai) est fortement récompensé.
 * Une auto-correction tardive après plusieurs erreurs prouve une assimilation naissante mais un réflexe encore instable.
 */
export function calculateAttemptScore(attempt: SkillAttempt): number {
  if (attempt.firstScore === 3) {
    // BEST immédiat : 100%
    return 100;
  }
  if (attempt.firstScore === 2) {
    // ACCEPTABLE : 66%
    return 66;
  }
  if (attempt.firstScore === 1) {
    // PREMATURE (raccourci) puis auto-corrigé : 40%
    return attempt.finalScore === 3 ? 40 : 20;
  }
  // INCORRECT (0)
  if (attempt.attemptCount > 2) {
    // 2 erreurs ou plus avant de trouver BEST : 20%
    return attempt.finalScore === 3 ? 20 : 0;
  }
  // 1 erreur puis correction : 30%
  return attempt.finalScore === 3 ? 30 : 0;
}

/**
 * Calcule le niveau de maîtrise d'une compétence en fonction des tentatives et de la diversité contextuelle
 */
export function computeSkillMastery(
  skillId: MethodologicalSkill,
  attempts: SkillAttempt[]
): SkillMastery {
  const skillAttempts = attempts.filter((a) => a.skillId === skillId);
  const totalAttempts = skillAttempts.length;

  if (totalAttempts === 0) {
    return {
      skillId,
      level: "UNTESTED",
      scorePercentage: 0,
      totalAttempts: 0,
      firstTrySuccessCount: 0,
      autoCorrectedCount: 0,
      repeatedErrorsCount: 0,
      distinctContextsCount: 0,
    };
  }

  let totalWeightedScore = 0;
  let firstTrySuccessCount = 0;
  let autoCorrectedCount = 0;
  let repeatedErrorsCount = 0;
  const distinctSources = new Set<string>();

  for (const att of skillAttempts) {
    totalWeightedScore += calculateAttemptScore(att);
    distinctSources.add(att.sourceId);

    if (att.firstScore === 3) {
      firstTrySuccessCount++;
    } else if (att.finalScore === 3) {
      autoCorrectedCount++;
    }

    if (att.firstScore === 0 || att.attemptCount > 2) {
      repeatedErrorsCount++;
    }
  }

  const distinctContextsCount = distinctSources.size;
  const scorePercentage = Math.round(totalWeightedScore / totalAttempts);

  // Détermination non-linéaire du niveau
  let level: SkillLevel = "DISCOVERY";

  if (totalAttempts <= 1 && scorePercentage < 80) {
    level = "DISCOVERY";
  } else if (scorePercentage < 35) {
    level = "DISCOVERY";
  } else if (scorePercentage < 66) {
    level = "ACQUIRING";
  } else if (scorePercentage < 85 || distinctContextsCount < 3) {
    // Exigence stricte : > 85% et minimum 3 contextes pour prétendre à MASTERED
    level = "SOLID";
  } else {
    // > 85% avec au moins 3 contextes distincts et stabilité (peu d'erreurs lourdes)
    level = repeatedErrorsCount <= 1 ? "MASTERED" : "SOLID";
  }

  const lastAttempt = skillAttempts[skillAttempts.length - 1];

  return {
    skillId,
    level,
    scorePercentage,
    totalAttempts,
    firstTrySuccessCount,
    autoCorrectedCount,
    repeatedErrorsCount,
    distinctContextsCount,
    lastAssessedAt: lastAttempt ? lastAttempt.timestamp : undefined,
  };
}

/**
 * Détecte les tendances et erreurs méthodologiques récurrentes observables à partir des erreurs répétées
 * RÈGLE DÉONTOLOGIQUE STRICTE : Analyse exclusivement les comportements d'uṣūl dans les exercices,
 * sans aucune inférence sur la foi, la personnalité ou la pratique religieuse.
 */
export function detectMethodologicalPatterns(
  skillsMap: Record<MethodologicalSkill, SkillMastery>
): IdentifiedMethodologicalPattern[] {
  const patterns: IdentifiedMethodologicalPattern[] = [];

  // 1. Isolationnisme textuel (EVIDENCE_AGGREGATION faible)
  const aggSkill = skillsMap.EVIDENCE_AGGREGATION;
  if (aggSkill && aggSkill.totalAttempts >= 2 && aggSkill.repeatedErrorsCount >= 1 && aggSkill.scorePercentage < 65) {
    patterns.push({
      id: "pattern-isolationnisme-textuel",
      skillId: "EVIDENCE_AGGREGATION",
      title: {
        fr: "Tendance à l'isolationnisme textuel",
        ar: "الميل إلى اجتزاء النصوص وعزلها",
      },
      description: {
        fr: "Tu as tendance à tirer une conclusion dogmatique ou juridique à partir d'un verset ou hadith isolé, sans vérifier s'il existe d'autres textes sur le sujet.",
        ar: "يلاحظ ميل إلى استنباط الأحكام من نصوص مفردة قبل استقراء نصوص الباب وضبط صلتها ببعض.",
      },
      observedPattern: {
        fr: `${aggSkill.repeatedErrorsCount} erreur(s) observée(s) lors du rapprochement des textes d'un même chapitre.`,
        ar: `تكرر الخطأ في ${aggSkill.repeatedErrorsCount} موضعاً عند مقارنة نصوص الباب الواحد.`,
      },
      occurrenceCount: aggSkill.repeatedErrorsCount,
      recommendedAction: {
        fr: "Étudier la leçon A02 (Jamʿ Nuṣūṣ al-Bāb) et refaire l'Enquête 09 (Allah pardonne tous les péchés).",
        ar: "مراجعة درس عقيدة 02 (جمع نصوص الباب) وإعادة تطبيق مسار التحقيق 09.",
      },
    });
  }

  // 2. Précipitation sur l'Ijmāʿ (IJMA_VERIFICATION faible)
  const ijmaSkill = skillsMap.IJMA_VERIFICATION;
  if (ijmaSkill && ijmaSkill.totalAttempts >= 2 && ijmaSkill.repeatedErrorsCount >= 1 && ijmaSkill.scorePercentage < 65) {
    patterns.push({
      id: "pattern-ijma-hatif",
      skillId: "IJMA_VERIFICATION",
      title: {
        fr: "Adhésion hâtive aux prétentions d'Ijmāʿ",
        ar: "التسليم السريع بدعاوى الإجماع",
      },
      description: {
        fr: "Tu confonds parfois une simple position majoritaire ou l'absence de contradicteur immédiat avec un véritable consensus unanime contraignant.",
        ar: "يقع خلط بين مذهب الجمهور أو عدم العلم بالمخالف، وبين ثبوت الإجماع القطعي الملزم.",
      },
      observedPattern: {
        fr: `${ijmaSkill.repeatedErrorsCount} affirmation(s) de consensus acceptée(s) sans audit philologique préalable.`,
        ar: `قُبلت دعوى إجماع في ${ijmaSkill.repeatedErrorsCount} موضعاً دون التحقق من ثبوتها الأصولي.`,
      },
      occurrenceCount: ijmaSkill.repeatedErrorsCount,
      recommendedAction: {
        fr: "Étudier la leçon F03 (L'Ijmāʿ et ses conditions) et refaire l'Enquête 05 (Zakāt des bijoux).",
        ar: "مراجعة درس فقه 03 (شروط الإجماع) وتطبيق مسار التحقيق 05 (زكاة الحلي).",
      },
    });
  }

  // 3. Vulnérabilité au sophisme d'autorité (BIAS_DETECTION / SOURCE_IDENTIFICATION faible)
  const biasSkill = skillsMap.BIAS_DETECTION;
  if (biasSkill && biasSkill.totalAttempts >= 2 && biasSkill.repeatedErrorsCount >= 1 && biasSkill.scorePercentage < 65) {
    patterns.push({
      id: "pattern-autorite-notoriete",
      skillId: "BIAS_DETECTION",
      title: {
        fr: "Sensibilité à l'argument de notoriété",
        ar: "التأثر بشهرة القول وسلطة القائل",
      },
      description: {
        fr: "Tu accordes parfois trop de crédit à une citation parce qu'elle est largement diffusée ou attribuée à un grand nom, sans exiger sa traçabilité primaire.",
        ar: "يُلاحظ قبول بعض الأقوال لمجرد ذيوعها على الألسن أو نسبتها لإمام كبير دون فحص المصدر الأصلي.",
      },
      observedPattern: {
        fr: `${biasSkill.repeatedErrorsCount} choix influencé(s) par la célébrité de la formule ou la confiance a priori.`,
        ar: `وقع التأثر بالشهرة أو التسليم بالدعوى في ${biasSkill.repeatedErrorsCount} مواضع.`,
      },
      occurrenceCount: biasSkill.repeatedErrorsCount,
      recommendedAction: {
        fr: "Étudier la leçon C02 (Le sophisme d'autorité) et refaire l'Enquête 07 (Si le hadith est authentique...).",
        ar: "مراجعة درس نقد 02 (مغالطة السلطة والشهرة) وتطبيق مسار التحقيق 07.",
      },
    });
  }

  // 4. Déduction hâtive sur le délaissement (DALALA_ANALYSIS faible)
  const dalalaSkill = skillsMap.DALALA_ANALYSIS;
  if (dalalaSkill && dalalaSkill.totalAttempts >= 2 && dalalaSkill.repeatedErrorsCount >= 1 && dalalaSkill.scorePercentage < 65) {
    patterns.push({
      id: "pattern-dalala-tark",
      skillId: "DALALA_ANALYSIS",
      title: {
        fr: "Saut déductif sur le délaissement prophétique (At-Tark)",
        ar: "القفز الاستدلالي في مسألة الترك النبوي",
      },
      description: {
        fr: "Tu as tendance à décréter l'interdiction d'un acte dès lors qu'il n'a pas été accompli matériellement, sans analyser le motif (muqtaḍī) ni l'empêchement (māniʿ).",
        ar: "الميل إلى تحريم الفعل بمجرد عدم نقله، دون فقه شروط الترك وتمييز المقاصد عن الوسائل.",
      },
      observedPattern: {
        fr: `${dalalaSkill.repeatedErrorsCount} qualification(s) précipitée(s) sur des questions de délaissement ou de portée de termes généraux.`,
        ar: `وقع التسرع في تكييف نصوص الدلالة أو الترك في ${dalalaSkill.repeatedErrorsCount} مواضع.`,
      },
      occurrenceCount: dalalaSkill.repeatedErrorsCount,
      recommendedAction: {
        fr: "Étudier la leçon F02 (Dalāla) et réviser l'étape 8 de l'Enquête 10.",
        ar: "مراجعة درس فقه 02 (مسالك الدلالة) ومراجعة الخطوة 8 من التحقيق 10.",
      },
    });
  }

  return patterns;
}

export const detectMethodologicalBiases = detectMethodologicalPatterns;

/**
 * Construit le profil méthodologique complet à partir de l'historique des tentatives
 */
export function buildMethodologicalProfile(
  attempts: SkillAttempt[],
  diagnosticCompleted = false,
  finalAssessmentCompleted = false
): MethodologicalProfile {
  const skillsMap = {} as Record<MethodologicalSkill, SkillMastery>;

  let evaluatedSkillsCount = 0;
  let masteredSkillsCount = 0;
  let solidSkillsCount = 0;
  let totalPercentageSum = 0;

  for (const skill of ALL_SKILLS) {
    const mastery = computeSkillMastery(skill, attempts);
    skillsMap[skill] = mastery;

    if (mastery.level !== "UNTESTED") {
      evaluatedSkillsCount++;
      totalPercentageSum += mastery.scorePercentage;
    }
    if (mastery.level === "MASTERED") {
      masteredSkillsCount++;
    } else if (mastery.level === "SOLID") {
      solidSkillsCount++;
    }
  }

  const globalMasteryPercentage =
    evaluatedSkillsCount > 0 ? Math.round(totalPercentageSum / evaluatedSkillsCount) : 0;

  // Tri des compétences par score pour identifier les points forts et faibles
  const evaluatedList = ALL_SKILLS.filter((s) => skillsMap[s].level !== "UNTESTED");
  evaluatedList.sort((a, b) => skillsMap[a].scorePercentage - skillsMap[b].scorePercentage);

  const weakestSkills = evaluatedList.slice(0, 3);
  const strongestSkills = evaluatedList.slice(-3).reverse();

  const identifiedPatterns = detectMethodologicalPatterns(skillsMap);

  return {
    skills: skillsMap,
    globalMasteryPercentage,
    evaluatedSkillsCount,
    masteredSkillsCount,
    solidSkillsCount,
    weakestSkills,
    strongestSkills,
    identifiedPatterns,
    identifiedBiases: identifiedPatterns, // Alias de rétrocompatibilité
    diagnosticCompleted,
    finalAssessmentCompleted,
    updatedAt: new Date().toISOString(),
  };
}

export const calculateMethodologicalProfile = buildMethodologicalProfile;

export function createInitialMethodologicalProfile(): MethodologicalProfile {
  return buildMethodologicalProfile([], false, false);
}

/**
 * Évalue l'éligibilité aux deux niveaux d'attestations officielles TABAYYUN
 * RÈGLE STRICTE :
 * - Niveau 1 (Parcours) : FinalAssessment >= 75% ET >= 5 contenus terminés
 * - Niveau 2 (Maîtrise) : FinalAssessment >= 85% ET aucune compétence critique < 70%
 *   ET >= 10 compétences SOLID/MASTERED ET diversité contextuelle (>= 3 contextes différents)
 */
export function evaluateAttestationEligibility(
  profile: MethodologicalProfile,
  finalScorePercent: number,
  completedItemsCount = 0
): {
  eligibleForPathAttestation: boolean;
  eligibleForMasteryAttestation: boolean;
  reasonsPath: { fr: string; ar: string };
  reasonsMastery: { fr: string; ar: string };
} {
  // 1. Niveau 1 : Attestation de parcours TABAYYUN
  const pathScoreOk = finalScorePercent >= 75;
  const pathExperienceOk = completedItemsCount >= 5;
  const eligibleForPathAttestation = pathScoreOk && pathExperienceOk;

  // 2. Niveau 2 : Attestation de maîtrise méthodologique TABAYYUN
  const masteryScoreOk = finalScorePercent >= 85;
  const allEvaluatedAbove70 = Object.values(profile.skills).every(
    (s) => s.level === "UNTESTED" || s.scorePercentage >= 70
  );
  const solidOrMasteredCount = profile.solidSkillsCount + profile.masteredSkillsCount;
  const solidOrMasteredOk = solidOrMasteredCount >= 10;
  const contextualDiversityOk =
    Object.values(profile.skills).filter((s) => s.distinctContextsCount >= 3).length >= 2;

  const eligibleForMasteryAttestation =
    masteryScoreOk && allEvaluatedAbove70 && solidOrMasteredOk && contextualDiversityOk;

  return {
    eligibleForPathAttestation,
    eligibleForMasteryAttestation,
    reasonsPath: {
      fr: eligibleForPathAttestation
        ? "Score final ≥ 75% et parcours minimum accompli (≥ 5 contenus)."
        : "Nécessite au moins 75% au test final et au moins 5 leçons ou enquêtes accomplies.",
      ar: eligibleForPathAttestation
        ? "نتيجة التقويم الختامي ≥ 75% مع إتمام 5 مسارات دراسية على الأقل."
        : "يتطلب الحصول على 75% على الأقل في التقويم الختامي وإتمام 5 مسارات.",
    },
    reasonsMastery: {
      fr: eligibleForMasteryAttestation
        ? "Excellence méthodologique confirmée (≥85%), aucune compétence <70%, ≥10 compétences solides et diversité contextuelle établie."
        : "Exige ≥85% au test final, aucune compétence sous 70%, 10+ compétences solides et preuve de diversité contextuelle (≥3 contextes).",
      ar: eligibleForMasteryAttestation
        ? "تمكن منهجي شامل (≥85%)، دون أي كفاءة تحت 70%، مع تمكن صلب في 10 كفاءات وتنوع سياقي مثبت."
        : "يتطلب ≥85%، مع عدم وجود أي كفاءة دون 70%، وتمكن صلب في 10 كفاءات مع التنوع السياقي (≥3 سياقات).",
    },
  };
}


