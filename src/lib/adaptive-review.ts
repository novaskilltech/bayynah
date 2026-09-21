import { MethodologicalProfile, AdaptiveReviewItem, MethodologicalSkill } from "@/types/skills";
import { getLessonsForSkill, getInquiryStepsForSkill } from "./skills-registry";

/**
 * Génère des recommandations de révision ciblées et adaptatives
 * en fonction des points faibles méthodologiques identifiés.
 */
export function getRecommendedReviews(profile: MethodologicalProfile): AdaptiveReviewItem[] {
  const recommendations: AdaptiveReviewItem[] = [];

  // Parcourir toutes les compétences évaluées
  for (const [skillIdStr, mastery] of Object.entries(profile.skills)) {
    const skillId = skillIdStr as MethodologicalSkill;

    // Déclencher une révision si la compétence est fragile (< 65%) ou comporte des erreurs répétées
    if (mastery.level !== "UNTESTED" && (mastery.scorePercentage < 65 || mastery.repeatedErrorsCount >= 2)) {
      const lessons = getLessonsForSkill(skillId);
      const inquirySteps = getInquiryStepsForSkill(skillId);

      const urgency =
        mastery.scorePercentage < 40 || mastery.repeatedErrorsCount >= 3
          ? "HIGH"
          : mastery.scorePercentage < 65
          ? "MEDIUM"
          : "LOW";

      recommendations.push({
        id: `review-${skillId.toLowerCase()}`,
        skillId,
        reason: {
          fr: `Score de maîtrise à ${mastery.scorePercentage}% avec ${mastery.repeatedErrorsCount} erreur(s) répétée(s). Revoir les fondamentaux méthodologiques de cette compétence.`,
          ar: `نسبة الإتقان ${mastery.scorePercentage}% مع تكرار الخطأ ${mastery.repeatedErrorsCount} مرة. يُوصى بتثبيت القواعد المنهجية لهذه المهارة.`,
        },
        recommendedLessons: lessons.slice(0, 2),
        recommendedInquirySteps: inquirySteps.slice(0, 2).map((s) => ({
          inquiryId: s.inquirySlug,
          stepNumber: s.stepNumber,
          title: {
            fr: `${s.inquirySlug} (Étape ${s.stepNumber})`,
            ar: `${s.inquirySlug} (الخطوة ${s.stepNumber})`,
          },
        })),
        urgency,
      });
    }
  }

  // Trier par urgence : HIGH d'abord, puis MEDIUM
  recommendations.sort((a, b) => {
    const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return order[a.urgency] - order[b.urgency];
  });

  return recommendations;
}
