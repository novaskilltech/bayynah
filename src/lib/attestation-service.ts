import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { AttestationType } from "@prisma/client";

/**
 * Interface du Keyring historique des clés de signature d'attestation
 */
export interface AttestationKeyring {
  activeVersion: string;
  keys: Record<string, string>;
}

function loadAttestationKeyring(): AttestationKeyring {
  const keys: Record<string, string> = {};

  // 1. Clés depuis ATTESTATION_KEYRING (format JSON) si présent
  if (process.env.ATTESTATION_KEYRING) {
    try {
      const parsed = JSON.parse(process.env.ATTESTATION_KEYRING);
      if (typeof parsed === "object" && parsed !== null) {
        Object.assign(keys, parsed);
      }
    } catch (err) {
      console.error("Erreur de parsing ATTESTATION_KEYRING:", err);
    }
  }

  // 2. Clés individuelles dans l'environnement (ATTESTATION_KEY_V1, ATTESTATION_KEY_V2, etc.)
  for (const [envKey, envVal] of Object.entries(process.env)) {
    if (envKey.startsWith("ATTESTATION_KEY_") && envVal) {
      const ver = envKey.replace("ATTESTATION_KEY_", "").toLowerCase();
      keys[ver] = envVal;
    }
  }

  // 3. Fallback sur ATTESTATION_SIGNING_SECRET pour la version v1
  if (!keys.v1) {
    keys.v1 =
      process.env.ATTESTATION_SIGNING_SECRET || "tabayyun-attestation-secret-v1-signing-key";
  }

  const activeVersion = process.env.ATTESTATION_ACTIVE_KEY_VERSION || "v1";

  return { activeVersion, keys };
}

let cachedKeyring: AttestationKeyring | null = null;

export function getKeyring(): AttestationKeyring {
  if (!cachedKeyring) {
    cachedKeyring = loadAttestationKeyring();
  }
  return cachedKeyring;
}

export function setKeyring(keyring: AttestationKeyring) {
  cachedKeyring = keyring;
}

export const CURRENT_KEY_VERSION = "v1";

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
 * Signe un payload canonique avec la clé spécifiée ou la clé active du keyring (HMAC-SHA256)
 */
export function signCanonicalPayload(
  canonicalPayload: string,
  keyVersion?: string
): { signature: string; keyVersion: string } {
  const keyring = getKeyring();
  const version = keyVersion || keyring.activeVersion;
  const secret = keyring.keys[version];

  if (!secret) {
    throw new Error(`Clé de signature introuvable dans le keyring pour la version ${version}`);
  }

  const signature = crypto.createHmac("sha256", secret).update(canonicalPayload).digest("hex");
  return { signature, keyVersion: version };
}

/**
 * Vérifie la signature d'un payload canonique en temps constant à l'aide du keyring historique
 */
export function verifyCanonicalSignature(
  canonicalPayload: string,
  signature: string,
  keyVersion: string
): boolean {
  const keyring = getKeyring();
  const secret = keyring.keys[keyVersion];
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
  publicNameConsent?: boolean;
}) {
  const rulesVersion = params.rulesVersion || "skills-v1";
  const issuedAt = new Date().toISOString();
  const attestationId = `ATT-${params.type}-${Date.now()}-${params.userId.slice(-6)}`;
  const keyring = getKeyring();
  const keyVersion = keyring.activeVersion;

  const canonicalPayload = buildCanonicalAttestationPayload({
    attestationId,
    type: params.type,
    issuedAt,
    finalScorePercent: params.finalScorePercent,
    rulesVersion,
    userId: params.userId,
    keyVersion,
  });

  const { signature: verificationHash } = signCanonicalPayload(canonicalPayload, keyVersion);

  return prisma.attestation.create({
    data: {
      id: attestationId,
      userId: params.userId,
      type: params.type,
      recipientName: params.recipientName,
      publicNameConsent: params.publicNameConsent ?? false,
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
  status: "VALID" | "REVOKED" | "NOT_FOUND" | "INVALID";
  error?: string;
  attestation?: {
    id: string;
    type: string;
    recipientName?: string;
    issuedAt: string;
    rulesVersion: string;
    revoked: boolean;
    revokedReason: string | null;
    demonstratedSkillsCount: number;
  };
}

/**
 * Vérification publique en lecture seule d'une attestation (Confidentialité stricte & Zéro fuite PII)
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
      publicNameConsent: true,
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
    return {
      valid: false,
      status: "NOT_FOUND",
      error: "Attestation introuvable dans le registre officiel TABAYYUN.",
    };
  }

  // Si révoquée, retourner le statut explicitement sans exposer d'identité
  if (attestation.revoked) {
    return {
      valid: false,
      status: "REVOKED",
      error: `Cette attestation a été révoquée : ${attestation.revokedReason || "Compte clôturé"}.`,
      attestation: {
        id: attestation.id,
        type: attestation.type,
        issuedAt: attestation.issuedAt.toISOString(),
        rulesVersion: attestation.rulesVersion,
        revoked: true,
        revokedReason: attestation.revokedReason,
        demonstratedSkillsCount: attestation.demonstratedSkillsCount,
      },
    };
  }

  if (!attestation.canonicalPayload) {
    return {
      valid: false,
      status: "INVALID",
      error: "Format d'attestation obsolète ou signature manquante.",
    };
  }

  // Vérifier la signature stockée avec la clé correspondante dans le keyring
  const isValidSignature = verifyCanonicalSignature(
    attestation.canonicalPayload,
    attestation.verificationHash,
    attestation.keyVersion
  );

  if (!isValidSignature) {
    return {
      valid: false,
      status: "INVALID",
      error: "Échec de vérification cryptographique de l'attestation.",
    };
  }

  // Si un hash fourni en paramètre (ex: QR code), vérifier correspondance
  if (providedHash) {
    const pBuf = Buffer.from(providedHash, "hex");
    const vBuf = Buffer.from(attestation.verificationHash, "hex");
    if (pBuf.length !== vBuf.length || !crypto.timingSafeEqual(pBuf, vBuf)) {
      return {
        valid: false,
        status: "INVALID",
        error: "Le hash fourni ne correspond pas au sceau officiel.",
      };
    }
  }

  return {
    valid: true,
    status: "VALID",
    attestation: {
      id: attestation.id,
      type: attestation.type,
      // Confidentialité stricte : Affichage du nom UNIQUEMENT en cas de consentement explicite
      recipientName: attestation.publicNameConsent ? attestation.recipientName : undefined,
      issuedAt: attestation.issuedAt.toISOString(),
      rulesVersion: attestation.rulesVersion,
      revoked: false,
      revokedReason: null,
      demonstratedSkillsCount: attestation.demonstratedSkillsCount,
    },
  };
}
