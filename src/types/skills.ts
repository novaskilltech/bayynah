import { BilingualText } from "./index";

/**
 * Référentiel canonique des 14 compétences méthodologiques TABAYYUN
 */
export type MethodologicalSkill =
  | "SOURCE_IDENTIFICATION"       // Identifier l'auteur, l'ouvrage et la chaîne de transmission
  | "PRIMARY_SOURCE_RETRIEVAL"   // Remonter aux sources primaires manuscrites ou imprimées
  | "AUTHENTICITY_CHECK"          // Évaluer l'isnād et le degré d'authenticité critique
  | "CONTEXT_ANALYSIS"           // Analyser le contexte textuel proche et la cause d'énonciation (sabab al-wurūd)
  | "TEXT_MEANING"               // Comprendre le sens propre du texte dans sa langue d'origine
  | "EVIDENCE_AGGREGATION"       // Réunir l'ensemble des textes d'un même chapitre (jamʿ nuṣūṣ al-bāb)
  | "DALALA_ANALYSIS"            // Auditer les modes d'inférence (ʿāmm/khāṣṣ, muṭlaq/muqayyad, at-tark)
  | "KHILAF_IDENTIFICATION"      // Cartographier la divergence réelle et distinguer ses niveaux
  | "SALAF_ATTRIBUTION"          // Vérifier la traçabilité documentaire d'une attribution collective aux Salaf
  | "IJMA_VERIFICATION"          // Auditer la solidité et le périmètre d'une prétention de consensus
  | "EPISTEMIC_CAUTION"          // Refuser la précipitation, suspendre le jugement si les preuves manquent
  | "CONCLUSION_CALIBRATION"     // Formuler une conclusion rigoureusement proportionnée aux preuves
  | "BIAS_DETECTION"             // Repérer l'isolationnisme textuel, le faux dilemme et le cherry-picking
  | "TERMINOLOGY_ANALYSIS";      // Distinguer le sens linguistique, légal et conventionnel (lā mushāḥḥata)

export type SkillId = MethodologicalSkill;

/**
 * Niveaux de maîtrise d'une compétence
 */
export type SkillLevel =
  | "UNTESTED"     // Non évaluée (0 tentative)
  | "DISCOVERY"    // À découvrir (< 35% ou 1 seule confrontation)
  | "ACQUIRING"    // En acquisition (35% - 65%)
  | "SOLID"        // Solide (66% - 85%)
  | "MASTERED";    // Maîtrisée (> 85% avec stabilité et diversité de contextes)

export interface SkillMetadata {
  id: MethodologicalSkill;
  name: BilingualText;
  shortDescription: BilingualText;
  longDescription: BilingualText;
  category: "SOURCES" | "CRITIQUE_TEXTUELLE" | "HERMENEUTIQUE" | "POSTURE_EPISTEMIQUE";
  iconName: string;
}

/**
 * Enregistrement d'un essai unitaire sur une compétence
 */
export interface SkillAttempt {
  id: string;
  skillId: MethodologicalSkill;
  sourceType: "DIAGNOSTIC" | "INQUIRY_STEP" | "LESSON_QUIZ" | "FINAL_ASSESSMENT";
  sourceId: string;       // e.g. "inquiry-05", "lesson-h02", "diag-01"
  stepNumber?: number;    // Pour les étapes d'enquête
  firstScore: number;     // 0, 1, 2 ou 3 (score obtenu dès la 1re réponse)
  finalScore: number;     // score après éventuelle auto-correction
  attemptCount: number;   // nombre de tentatives avant succès
  correctedAfterFeedback: boolean;
  timestamp: string;      // ISO 8601
}

/**
 * Bilan de maîtrise pour une compétence donnée
 */
export interface SkillMastery {
  skillId: MethodologicalSkill;
  level: SkillLevel;
  scorePercentage: number; // 0 à 100
  totalAttempts: number;
  firstTrySuccessCount: number; // nombre de BEST immédiats
  autoCorrectedCount: number;   // corrigé après feedback
  repeatedErrorsCount: number;  // erreurs répétées (2+ essais non optimaux)
  distinctContextsCount: number;// nombre de sources différentes (inquiries, lessons, diagnostic)
  lastAssessedAt?: string;
}

/**
 * Profil méthodologique global de l'utilisateur
 */
export interface MethodologicalProfile {
  skills: Record<MethodologicalSkill, SkillMastery>;
  globalMasteryPercentage: number;
  evaluatedSkillsCount: number;
  masteredSkillsCount: number;
  solidSkillsCount: number;
  weakestSkills: MethodologicalSkill[];
  strongestSkills: MethodologicalSkill[];
  identifiedPatterns: IdentifiedMethodologicalPattern[];
  identifiedBiases: IdentifiedMethodologicalPattern[]; // Alias de rétrocompatibilité (toujours initialisé)
  diagnosticCompleted: boolean;
  finalAssessmentCompleted: boolean;
  updatedAt: string;
}

export type UserLearningProfile = MethodologicalProfile;

/**
 * Tendance ou erreur méthodologique observée (comportement d'erreur récurrent lors des exercices)
 */
export interface IdentifiedMethodologicalPattern {
  id: string;
  skillId: MethodologicalSkill;
  title: BilingualText;
  description: BilingualText;
  observedPattern: BilingualText; // Ex: "3 conclusions formulées avant de réunir les textes du chapitre"
  occurrenceCount: number;
  recommendedAction: BilingualText;
}

// Alias de rétrocompatibilité
export type IdentifiedMethodologicalBias = IdentifiedMethodologicalPattern;

/**
 * Structure d'une question de Diagnostic Initial
 */
export interface DiagnosticOption {
  id: string;
  text: BilingualText;
  quality: "BEST" | "ACCEPTABLE" | "PREMATURE" | "INCORRECT";
  methodologicalScore: 0 | 1 | 2 | 3;
  feedback: BilingualText;
}

export interface DiagnosticQuestion {
  id: string;
  order: number;
  title: BilingualText;
  situation: BilingualText;
  primarySkill: MethodologicalSkill;
  secondarySkills?: MethodologicalSkill[];
  options: DiagnosticOption[];
}

export interface DiagnosticAttempt {
  completedAt: string;
  answers: Record<string, string>; // questionId -> optionId
  skillScores: Record<MethodologicalSkill, { score: number; maxScore: number; percentage: number }>;
}

/**
 * Structure de l'Évaluation Finale de Transfert
 */
export interface FinalAssessmentScenario {
  id: string;
  order: number;
  title: BilingualText;
  contextDescription: BilingualText;
  claim: BilingualText;
  primarySkill: MethodologicalSkill;
  options: DiagnosticOption[];
}

export type AttestationType = "PARCOURS" | "MAITRISE_METHODOLOGIQUE";

export interface FinalAssessmentAttempt {
  completedAt: string;
  answers: Record<string, string>; // scenarioId -> optionId
  skillScores: Record<MethodologicalSkill, { score: number; maxScore: number; percentage: number }>;
  globalPercentage: number;
  eligibleForPathAttestation: boolean;
  eligibleForMasteryAttestation: boolean;
  eligibleForAttestation?: boolean; // Alias de rétrocompatibilité
  rulesVersion?: string;
}

/**
 * Recommandation de révision adaptative
 */
export interface AdaptiveReviewItem {
  id: string;
  skillId: MethodologicalSkill;
  reason: BilingualText;
  recommendedLessons: string[];     // IDs de leçons (ex: ["lesson-c03", "lesson-a02"])
  recommendedInquirySteps: {        // Étapes d'enquêtes à refaire
    inquiryId: string;
    stepNumber: number;
    title: BilingualText;
  }[];
  urgency: "HIGH" | "MEDIUM" | "LOW";
}

/**
 * Structure d'un palier du parcours d'apprentissage
 */
export interface LearningPathLevel {
  levelNumber: 1 | 2 | 3 | 4 | 5;
  title: BilingualText;
  description: BilingualText;
  targetSkills: MethodologicalSkill[];
  lessonIds: string[];
  inquiryIds: string[];
  milestoneDescription: BilingualText;
}

/**
 * Données d'une Attestation officielle TABAYYUN (Parcours ou Maîtrise)
 */
export interface AttestationData {
  type: AttestationType;
  recipientName: string;
  issuedAt: string;
  attestationId: string;
  globalScore: number;
  masteredSkillsCount: number;
  totalSkillsCount: number;
  rulesVersion: string;
  signatureAuthority: string;
  legalNoticeFr: string;
  legalNoticeAr: string;
}
