import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { AttestationType } from "@prisma/client";

const ATTESTATION_SIGNING_SECRET =
  process.env.ATTESTATION_SIGNING_SECRET || "tabayyun-attestation-secret-v1-signing-key";

export const CURRENT_KEY_VERSION = process.env.ATTESTATION_KEY_VERSION || "v1";

// Table des clés de signature pour permettre la rotation des clés (kid) sans invalider l'historique
const KNOWN_ATTESTATION_KEYS: Record<string, string> = {
  v1: ATTESTATION_SIGNING_SECRET,
};

/**
 * Construit le payload canonique normalisé pour la signature cryptographique
 */
export function buildCanonicalAttestationPayload(params: {
  attestationId: string;
  type: string;
  issuedAt: string;
  finalScorePercent: number;
  rulesVersion: string;
  userId: string;
  keyVersion: string;
}): string {
  return [
    params.attestationId,
    params.type,
    params.issuedAt,
    params.finalScorePercent.toFixed(2),
    params.rulesVersion,
    params.userId,
    params.keyVersion,
  ].join("|");
}

/**
 * Signe un payload canonique avec la clé spécifiée (HMAC-SHA256)
 */
export function signCanonicalPayload(canonicalPayload: string, keyVersion = CURRENT_KEY_VERSION): string {
  const secret = KNOWN_ATTESTATION_KEYS[keyVersion] || ATTESTATION_SIGNING_SECRET;
  return crypto.createHmac("sha256", secret).update(canonicalPayload).digest("hex");
}

/**
 * Vérifie la signature d'un payload canonique en temps constant
 */
export function verifyCanonicalSignature(
  canonicalPayload: string,
  signature: string,
  keyVersion = CURRENT_KEY_VERSION
): boolean {
  const secret = KNOWN_ATTESTATION_KEYS[keyVersion];
  if (!secret) return false;

  const expectedSig = crypto.createHmac("sha256", secret).update(canonicalPayload).digest("hex");
  const sigBuf = Buffer.from(signature, "hex");
  const expBuf = Buffer.from(expectedSig, "hex");

  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expBuf);
}

/**
 * Émet et persiste une attestation officielle avec sceau cryptographique canonique
 */
export async function issueOfficialAttestation(params: {
  userId: string;
  type: AttestationType;
  recipientName: string;
  finalScorePercent: number;
  demonstratedSkillsCount: number;
  contextCount: number;
  rulesVersion?: string;
}) {
  const rulesVersion = params.rulesVersion || "skills-v1";
  const issuedAt = new Date().toISOString();
  const attestationId = `ATT-${params.type}-${Date.now()}-${params.userId.slice(-6)}`;
  const keyVersion = CURRENT_KEY_VERSION;

  const canonicalPayload = buildCanonicalAttestationPayload({
    attestationId,
    type: params.type,
    issuedAt,
    finalScorePercent: params.finalScorePercent,
    rulesVersion,
    userId: params.userId,
    keyVersion,
  });

  const verificationHash = signCanonicalPayload(canonicalPayload, keyVersion);

  return prisma.attestation.create({
    data: {
      id: attestationId,
      userId: params.userId,
      type: params.type,
      recipientName: params.recipientName,
      issuedAt: new Date(issuedAt),
      rulesVersion,
      keyVersion,
      canonicalPayload,
      finalScorePercent: params.finalScorePercent,
      demonstratedSkillsCount: params.demonstratedSkillsCount,
      contextCount: params.contextCount,
      verificationHash,
    },
  });
}

export interface PublicAttestationVerificationResult {
  valid: boolean;
  error?: string;
  attestation?: {
    id: string;
    type: string;
    recipientName: string;
    issuedAt: string;
    rulesVersion: string;
    revoked: boolean;
    revokedReason: string | null;
    demonstratedSkillsCount: number;
  };
}

/**
 * Vérification publique en lecture seule d'une attestation (Zéro PII sensible divulguée)
 */
export async function verifyPublicAttestation(
  attestationId: string,
  providedHash?: string
): Promise<PublicAttestationVerificationResult> {
  const attestation = await prisma.attestation.findUnique({
    where: { id: attestationId },
    select: {
      id: true,
      type: true,
      recipientName: true,
      issuedAt: true,
      rulesVersion: true,
      keyVersion: true,
      canonicalPayload: true,
      verificationHash: true,
      revoked: true,
      revokedReason: true,
      demonstratedSkillsCount: true,
    },
  });

  if (!attestation) {
    return { valid: false, error: "Attestation introuvable dans le registre officiel TABAYYUN." };
  }

  if (attestation.revoked) {
    return {
      valid: false,
      error: `Cette attestation a été révoquée : ${attestation.revokedReason || "Compte clôturé"}.`,
      attestation: {
        id: attestation.id,
        type: attestation.type,
        recipientName: "Compte clôturé",
        issuedAt: attestation.issuedAt.toISOString(),
        rulesVersion: attestation.rulesVersion,
        revoked: true,
        revokedReason: attestation.revokedReason,
        demonstratedSkillsCount: attestation.demonstratedSkillsCount,
      },
    };
  }

  // Si le payload canonique n'est pas présent (anciennes attestations), échec
  if (!attestation.canonicalPayload) {
    return { valid: false, error: "Format d'attestation obsolète ou signature manquante." };
  }

  // Vérifier la signature stockée avec la clé
  const isValidSignature = verifyCanonicalSignature(
    attestation.canonicalPayload,
    attestation.verificationHash,
    attestation.keyVersion
  );

  if (!isValidSignature) {
    return { valid: false, error: "Échec de vérification cryptographique de l'attestation." };
  }

  // Si un hash fourni en paramètre (ex: QR code), vérifier correspondance
  if (providedHash) {
    const pBuf = Buffer.from(providedHash, "hex");
    const vBuf = Buffer.from(attestation.verificationHash, "hex");
    if (pBuf.length !== vBuf.length || !crypto.timingSafeEqual(pBuf, vBuf)) {
      return { valid: false, error: "Le hash fourni ne correspond pas au sceau officiel." };
    }
  }

  return {
    valid: true,
    attestation: {
      id: attestation.id,
      type: attestation.type,
      recipientName: attestation.recipientName,
      issuedAt: attestation.issuedAt.toISOString(),
      rulesVersion: attestation.rulesVersion,
      revoked: false,
      revokedReason: null,
      demonstratedSkillsCount: attestation.demonstratedSkillsCount,
    },
  };
}
