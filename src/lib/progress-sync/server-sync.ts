import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import {
  MethodologicalProfile,
  MethodologicalSkill,
  SkillAttempt,
  AttestationData,
} from "@/types/skills";
import {
  buildMethodologicalProfile,
  evaluateAttestationEligibility,
} from "@/lib/skills-calculator";
import {
  SyncPayload,
  SyncResult,
  ExportedUserData,
  SkillAttemptInput,
  DiagnosticAttemptInput,
  FinalAssessmentAttemptInput,
} from "./types";

/**
 * Génère une signature HMAC-SHA256 pour sceller l'attestation côté serveur
 */
function generateAttestationHash(
  attestationId: string,
  userId: string,
  type: string,
  finalScore: number,
  issuedAt: string
): string {
  const secret = process.env.AUTH_SECRET || "tabayyun-secret-key-phase6";
  return crypto
    .createHmac("sha256", secret)
    .update(`${attestationId}:${userId}:${type}:${finalScore}:${issuedAt}`)
    .digest("hex");
}

/**
 * Reconstruit le profil d'apprentissage de l'utilisateur à partir des tentatives brutes stockées en base
 */
export async function rebuildLearningProfile(userId: string): Promise<MethodologicalProfile> {
  const dbAttempts = await prisma.skillAttempt.findMany({
    where: { userId },
    orderBy: { clientTimestamp: "asc" },
  });

  const diagnosticCount = await prisma.diagnosticAttempt.count({ where: { userId } });
  const finalAssessmentCount = await prisma.finalAssessmentAttempt.count({ where: { userId } });

  const attempts: SkillAttempt[] = dbAttempts.map((a) => {
    const meta = (a.metadata as Record<string, unknown>) || {};
    return {
      id: a.id,
      skillId: a.skillId as MethodologicalSkill,
      sourceType: a.contextType as SkillAttempt["sourceType"],
      sourceId: a.contextId,
      stepNumber: typeof meta.stepNumber === "number" ? meta.stepNumber : undefined,
      firstScore: typeof meta.firstScore === "number" ? meta.firstScore : Math.round(a.score * 3),
      finalScore: typeof meta.finalScore === "number" ? meta.finalScore : Math.round(a.score * 3),
      attemptCount: typeof meta.attemptCount === "number" ? meta.attemptCount : 1,
      correctedAfterFeedback:
        typeof meta.correctedAfterFeedback === "boolean" ? meta.correctedAfterFeedback : false,
      timestamp: a.clientTimestamp.toISOString(),
    };
  });

  const profile = buildMethodologicalProfile(
    attempts,
    diagnosticCount > 0,
    finalAssessmentCount > 0
  );

  // Sauvegarde / Upsert de la projection dénormalisée dans LearningProfile
  await prisma.learningProfile.upsert({
    where: { userId },
    create: {
      userId,
      evaluatedSkillsCount: profile.evaluatedSkillsCount,
      globalScorePercent: profile.globalMasteryPercentage,
      skillsData: JSON.parse(JSON.stringify(profile.skills)),
      observedPatterns: JSON.parse(JSON.stringify(profile.identifiedPatterns)),
      rulesVersion: "skills-v1",
      lastRecalculatedAt: new Date(),
    },
    update: {
      evaluatedSkillsCount: profile.evaluatedSkillsCount,
      globalScorePercent: profile.globalMasteryPercentage,
      skillsData: JSON.parse(JSON.stringify(profile.skills)),
      observedPatterns: JSON.parse(JSON.stringify(profile.identifiedPatterns)),
      rulesVersion: "skills-v1",
      lastRecalculatedAt: new Date(),
    },
  });

  return profile;
}

/**
 * Synchronise les données d'apprentissage (idempotence stricte par UUID)
 */
export async function syncUserProgress(
  userId: string,
  payload: SyncPayload,
  clientIp?: string,
  userAgent?: string
): Promise<SyncResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true },
  });

  if (!user) {
    throw new Error(`Utilisateur ${userId} introuvable pour la synchronisation.`);
  }

  let syncedAttemptsCount = 0;
  let ignoredDuplicatesCount = 0;

  // 1. Ingestion idempotente des SkillAttempts
  if (payload.skillAttempts && payload.skillAttempts.length > 0) {
    const candidateIds = payload.skillAttempts.map((a) => a.id);
    const existing = await prisma.skillAttempt.findMany({
      where: { userId, id: { in: candidateIds } },
      select: { id: true },
    });
    const existingIdSet = new Set(existing.map((e) => e.id));

    const toInsert = payload.skillAttempts.filter((a) => !existingIdSet.has(a.id));
    ignoredDuplicatesCount += candidateIds.length - toInsert.length;

    if (toInsert.length > 0) {
      await prisma.skillAttempt.createMany({
        data: toInsert.map((a) => ({
          id: a.id,
          userId,
          skillId: a.skillId,
          contextId: a.contextId,
          contextType: a.contextType,
          score: a.score,
          weight: a.weight ?? 1.0,
          metadata: a.metadata ? JSON.parse(JSON.stringify(a.metadata)) : undefined,
          clientTimestamp: new Date(a.clientTimestamp),
        })),
      });
      syncedAttemptsCount += toInsert.length;
    }
  }

  // 2. Ingestion idempotente des DiagnosticAttempts
  if (payload.diagnosticAttempts && payload.diagnosticAttempts.length > 0) {
    for (const diag of payload.diagnosticAttempts) {
      const exists = await prisma.diagnosticAttempt.findUnique({
        where: { id: diag.id },
        select: { id: true },
      });
      if (!exists) {
        await prisma.diagnosticAttempt.create({
          data: {
            id: diag.id,
            userId,
            scorePercent: diag.scorePercent,
            answers: JSON.parse(JSON.stringify(diag.answers)),
            rulesVersion: diag.rulesVersion || "diagnostic-v1",
            clientTimestamp: new Date(diag.clientTimestamp),
          },
        });
      }
    }
  }

  // 3. Ingestion idempotente des FinalAssessmentAttempts
  if (payload.finalAssessmentAttempts && payload.finalAssessmentAttempts.length > 0) {
    for (const finalAssess of payload.finalAssessmentAttempts) {
      const exists = await prisma.finalAssessmentAttempt.findUnique({
        where: { id: finalAssess.id },
        select: { id: true },
      });
      if (!exists) {
        await prisma.finalAssessmentAttempt.create({
          data: {
            id: finalAssess.id,
            userId,
            scorePercent: finalAssess.scorePercent,
            answers: JSON.parse(JSON.stringify(finalAssess.answers)),
            rulesVersion: finalAssess.rulesVersion || "assessment-v1",
            eligibleForPathAttestation: finalAssess.scorePercent >= 75,
            eligibleForMasteryAttestation: finalAssess.scorePercent >= 85,
            clientTimestamp: new Date(finalAssess.clientTimestamp),
          },
        });
      }
    }
  }

  // 4. Ingestion des contenus terminés (leçons / enquêtes)
  if (payload.completedContentIds && payload.completedContentIds.length > 0) {
    for (const contentId of payload.completedContentIds) {
      if (contentId.startsWith("inquiry-")) {
        await prisma.inquiryProgress.upsert({
          where: { userId_inquiryId: { userId, inquiryId: contentId } },
          create: { userId, inquiryId: contentId, completed: true, completedAt: new Date() },
          update: { completed: true, completedAt: new Date() },
        });
      } else if (contentId.startsWith("lesson-") || contentId.startsWith("h") || contentId.startsWith("f") || contentId.startsWith("a") || contentId.startsWith("c")) {
        await prisma.lessonProgress.upsert({
          where: { userId_lessonId: { userId, lessonId: contentId } },
          create: { userId, lessonId: contentId, completed: true, completedAt: new Date() },
          update: { completed: true, completedAt: new Date() },
        });
      }
    }
  }

  // 5. Reconstitution recalculée côté serveur
  const recalculatedProfile = await rebuildLearningProfile(userId);

  // 6. Évaluation et émission certifiée des attestations côté serveur
  const completedLessonsCount = await prisma.lessonProgress.count({
    where: { userId, completed: true },
  });
  const completedInquiriesCount = await prisma.inquiryProgress.count({
    where: { userId, completed: true },
  });
  const totalCompletedCount = completedLessonsCount + completedInquiriesCount;

  const latestFinal = await prisma.finalAssessmentAttempt.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const existingAttestations = await prisma.attestation.findMany({
    where: { userId, revoked: false },
  });
  const existingTypes = new Set(existingAttestations.map((a) => a.type));

  if (latestFinal) {
    const eligibility = evaluateAttestationEligibility(
      recalculatedProfile,
      latestFinal.scorePercent,
      totalCompletedCount
    );

    const recipientName = user.name || "Apprenant TABAYYUN";
    const nowIso = new Date().toISOString();

    // Attestation Maîtrise
    if (eligibility.eligibleForMasteryAttestation && !existingTypes.has("MAITRISE_METHODOLOGIQUE")) {
      const attId = `ATT-MAITRISE-${Date.now()}-${userId.slice(-6)}`;
      const hash = generateAttestationHash(
        attId,
        userId,
        "MAITRISE_METHODOLOGIQUE",
        latestFinal.scorePercent,
        nowIso
      );

      await prisma.attestation.create({
        data: {
          id: attId,
          userId,
          type: "MAITRISE_METHODOLOGIQUE",
          recipientName,
          rulesVersion: "skills-v1",
          finalScorePercent: latestFinal.scorePercent,
          demonstratedSkillsCount: recalculatedProfile.solidSkillsCount + recalculatedProfile.masteredSkillsCount,
          contextCount: Math.max(...Object.values(recalculatedProfile.skills).map((s) => s.distinctContextsCount), 1),
          verificationHash: hash,
        },
      });
    }

    // Attestation Parcours
    if (eligibility.eligibleForPathAttestation && !existingTypes.has("PARCOURS")) {
      const attId = `ATT-PARCOURS-${Date.now()}-${userId.slice(-6)}`;
      const hash = generateAttestationHash(
        attId,
        userId,
        "PARCOURS",
        latestFinal.scorePercent,
        nowIso
      );

      await prisma.attestation.create({
        data: {
          id: attId,
          userId,
          type: "PARCOURS",
          recipientName,
          rulesVersion: "skills-v1",
          finalScorePercent: latestFinal.scorePercent,
          demonstratedSkillsCount: recalculatedProfile.solidSkillsCount + recalculatedProfile.masteredSkillsCount,
          contextCount: Math.max(...Object.values(recalculatedProfile.skills).map((s) => s.distinctContextsCount), 1),
          verificationHash: hash,
        },
      });
    }
  }

  // 7. Rechargement des attestations à jour
  const currentDbAttestations = await prisma.attestation.findMany({
    where: { userId, revoked: false },
    orderBy: { issuedAt: "desc" },
  });

  const formattedAttestations: AttestationData[] = currentDbAttestations.map((a) => ({
    type: a.type as "PARCOURS" | "MAITRISE_METHODOLOGIQUE",
    recipientName: a.recipientName,
    issuedAt: a.issuedAt.toISOString(),
    attestationId: a.id,
    globalScore: Math.round(a.finalScorePercent),
    masteredSkillsCount: a.demonstratedSkillsCount,
    totalSkillsCount: 14,
    rulesVersion: a.rulesVersion,
    signatureAuthority: "Comité de Méthodologie TABAYYUN",
    legalNoticeFr:
      "Cette attestation confirme l'accomplissement d'un parcours d'entraînement à la rigueur critique et à la vérification méthodique selon les règles d'Ahl as-Sunnah wa-l-Jamâʿa. Elle ne constitue ni une ijāza d'enseignement, ni une habilitation à délivrer des avis juridiques (fatwas).",
    legalNoticeAr:
      "تشهد هذه الإفادة بإتمام تدريب منهجي على قواعد التثبت والنقد الحديثي والأصولي وفق معايير أهل السنة والجماعة، ولا تُعد إجازة تدريس ولا ترخيصاً بالفتوى أو الاجتهاد.",
  }));

  // 8. Audit log
  await prisma.auditLog.create({
    data: {
      userId,
      action: "SYNC_ATTEMPTS",
      details: {
        syncedAttemptsCount,
        ignoredDuplicatesCount,
        totalAttempts: await prisma.skillAttempt.count({ where: { userId } }),
      },
      ipAddress: clientIp,
      userAgent,
    },
  });

  return {
    success: true,
    syncedAttemptsCount,
    ignoredDuplicatesCount,
    recalculatedProfile,
    attestations: formattedAttestations,
    syncTimestamp: new Date().toISOString(),
  };
}

/**
 * Export complet des données utilisateur conforme RGPD / DSAR
 * Droit d'accès et de portabilité des données
 */
export async function exportUserData(userId: string): Promise<ExportedUserData> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new Error(`Utilisateur ${userId} introuvable.`);
  }

  const profile = await rebuildLearningProfile(userId);

  const rawSkillAttempts = await prisma.skillAttempt.findMany({
    where: { userId },
    orderBy: { clientTimestamp: "asc" },
  });

  const skillAttempts: SkillAttemptInput[] = rawSkillAttempts.map((a) => ({
    id: a.id,
    skillId: a.skillId as MethodologicalSkill,
    contextId: a.contextId,
    contextType: a.contextType as SkillAttemptInput["contextType"],
    score: a.score,
    weight: a.weight,
    metadata: a.metadata as Record<string, unknown> | undefined,
    clientTimestamp: a.clientTimestamp.toISOString(),
  }));

  const rawDiagnosticAttempts = await prisma.diagnosticAttempt.findMany({
    where: { userId },
    orderBy: { clientTimestamp: "asc" },
  });

  const diagnosticAttempts: DiagnosticAttemptInput[] = rawDiagnosticAttempts.map((d) => ({
    id: d.id,
    scorePercent: d.scorePercent,
    answers: d.answers as Record<string, string>,
    rulesVersion: d.rulesVersion,
    clientTimestamp: d.clientTimestamp.toISOString(),
  }));

  const rawFinalAssessments = await prisma.finalAssessmentAttempt.findMany({
    where: { userId },
    orderBy: { clientTimestamp: "asc" },
  });

  const finalAssessmentAttempts: FinalAssessmentAttemptInput[] = rawFinalAssessments.map((f) => ({
    id: f.id,
    scorePercent: f.scorePercent,
    answers: f.answers as Record<string, string>,
    rulesVersion: f.rulesVersion,
    clientTimestamp: f.clientTimestamp.toISOString(),
  }));

  const rawAttestations = await prisma.attestation.findMany({
    where: { userId, revoked: false },
    orderBy: { issuedAt: "desc" },
  });

  const attestations: AttestationData[] = rawAttestations.map((a) => ({
    type: a.type as "PARCOURS" | "MAITRISE_METHODOLOGIQUE",
    recipientName: a.recipientName,
    issuedAt: a.issuedAt.toISOString(),
    attestationId: a.id,
    globalScore: Math.round(a.finalScorePercent),
    masteredSkillsCount: a.demonstratedSkillsCount,
    totalSkillsCount: 14,
    rulesVersion: a.rulesVersion,
    signatureAuthority: "Comité de Méthodologie TABAYYUN",
    legalNoticeFr:
      "Cette attestation confirme l'accomplissement d'un parcours d'entraînement à la rigueur critique et à la vérification méthodique selon les règles d'Ahl as-Sunnah wa-l-Jamâʿa. Elle ne constitue ni une ijāza d'enseignement, ni une habilitation à délivrer des avis juridiques (fatwas).",
    legalNoticeAr:
      "تشهد هذه الإفادة بإتمام تدريب منهجي على قواعد التثبت والنقد الحديثي والأصولي وفق معايير أهل السنة والجماعة، ولا تُعد إجازة تدريس ولا ترخيصاً بالفتوى أو الاجتهاد.",
  }));

  await prisma.auditLog.create({
    data: {
      userId,
      action: "EXPORT_DATA",
      details: { exportType: "RGPD_DSAR_FULL_EXPORT" },
    },
  });

  return {
    account: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    },
    learningProfile: profile,
    skillAttempts,
    diagnosticAttempts,
    finalAssessmentAttempts,
    attestations,
    exportTimestamp: new Date().toISOString(),
    privacyNotice:
      "Données personnelles strictement pédagogiques et méthodologiques. Aucune donnée religieuse, intime ou doctrinale inférée. Données d'entraînement conservées sous le contrôle exclusif de l'apprenant.",
  };
}

/**
 * Suppression de compte conforme RGPD (Droit à l'effacement / Droit à l'oubli)
 */
export async function deleteUserAccount(userId: string): Promise<{ success: boolean; deletedAt: string }> {
  // Enregistre l'action d'audit anonymisée avant suppression
  await prisma.auditLog.create({
    data: {
      action: "DELETE_ACCOUNT",
      details: { deletedUserIdHash: crypto.createHash("sha256").update(userId).digest("hex") },
    },
  });

  // Suppression en cascade du User (supprime attempts, profile, progress, etc.)
  await prisma.user.delete({
    where: { id: userId },
  });

  return {
    success: true,
    deletedAt: new Date().toISOString(),
  };
}
