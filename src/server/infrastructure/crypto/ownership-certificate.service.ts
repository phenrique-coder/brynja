import {
  TargetAuthorizationEntity,
  VerificationMethod,
} from '../../domain/entities/scan.types';
import { ITokenCipher } from '../../domain/ports/server.ports';

export interface SealedChallengePayload {
  id: string;
  ownerGithubUserId: string;
  origin: string;
  hostname: string;
  method: VerificationMethod;
  challengeToken: string;
  createdAt: string;
  expiresAt: string;
}

export interface SealedOwnershipCertificatePayload {
  id: string;
  ownerGithubUserId: string;
  origin: string;
  hostname: string;
  method: VerificationMethod;
  challengeToken: string;
  verifiedAt: string;
  expiresAt: string;
  createdAt: string;
}

export interface UnsealedCertificateResult {
  authorization: TargetAuthorizationEntity;
  isExpired: boolean;
}

export class OwnershipCertificateService {
  constructor(private readonly cipher: ITokenCipher) {}

  sealChallenge(payload: SealedChallengePayload): string {
    const encrypted = this.cipher.encrypt(JSON.stringify(payload));
    return `ch1.${encrypted.iv}.${encrypted.authTag}.${encrypted.encryptedToken}`;
  }

  unsealChallenge(token: string | undefined | null): SealedChallengePayload | null {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 4 || parts[0] !== 'ch1') return null;

    const [, iv, authTag, encryptedToken] = parts;
    if (!iv || !authTag || !encryptedToken) return null;

    try {
      const plaintext = this.cipher.decrypt({ iv, authTag, encryptedToken });
      const parsed = JSON.parse(plaintext) as Partial<SealedChallengePayload>;
      if (
        !parsed.id ||
        !parsed.ownerGithubUserId ||
        !parsed.origin ||
        !parsed.hostname ||
        !parsed.method ||
        !parsed.challengeToken ||
        !parsed.createdAt ||
        !parsed.expiresAt
      ) {
        return null;
      }
      return parsed as SealedChallengePayload;
    } catch {
      return null;
    }
  }

  sealVerifiedCertificate(payload: SealedOwnershipCertificatePayload): string {
    const encrypted = this.cipher.encrypt(JSON.stringify(payload));
    return `vc1.${encrypted.iv}.${encrypted.authTag}.${encrypted.encryptedToken}`;
  }

  unsealVerifiedCertificate(
    token: string | undefined | null,
    now: Date = new Date(),
  ): UnsealedCertificateResult | null {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 4 || parts[0] !== 'vc1') return null;

    const [, iv, authTag, encryptedToken] = parts;
    if (!iv || !authTag || !encryptedToken) return null;

    try {
      const plaintext = this.cipher.decrypt({ iv, authTag, encryptedToken });
      const parsed = JSON.parse(
        plaintext,
      ) as Partial<SealedOwnershipCertificatePayload>;
      if (
        !parsed.id ||
        !parsed.ownerGithubUserId ||
        !parsed.origin ||
        !parsed.hostname ||
        !parsed.method ||
        !parsed.challengeToken ||
        !parsed.verifiedAt ||
        !parsed.expiresAt
      ) {
        return null;
      }

      const isExpired = new Date(parsed.expiresAt) <= now;
      return {
        isExpired,
        authorization: {
          id: parsed.id,
          ownerGithubUserId: parsed.ownerGithubUserId,
          origin: parsed.origin,
          hostname: parsed.hostname,
          method: parsed.method,
          challengeToken: parsed.challengeToken,
          status: 'VERIFIED',
          verifiedAt: parsed.verifiedAt,
          expiresAt: parsed.expiresAt,
          createdAt: parsed.createdAt ?? parsed.verifiedAt,
          updatedAt: parsed.verifiedAt,
          verificationProof: token,
        },
      };
    } catch {
      return null;
    }
  }
}
