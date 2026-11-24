import {
  AuthorizationStatus,
  TargetAuthorizationEntity,
  VerificationMethod,
} from '../entities/scan.types';

export const TARGET_AUTHORIZATION_REPO_PORT = Symbol(
  'TARGET_AUTHORIZATION_REPO_PORT',
);
export const DOMAIN_OWNERSHIP_VERIFIER_PORT = Symbol(
  'DOMAIN_OWNERSHIP_VERIFIER_PORT',
);

export interface CreateAuthorizationChallengeInput {
  ownerGithubUserId: string;
  origin: string;
  hostname: string;
  method: VerificationMethod;
  challengeToken: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface ITargetAuthorizationRepository {
  upsertPendingChallenge(
    input: CreateAuthorizationChallengeInput,
  ): Promise<TargetAuthorizationEntity>;
  findByIdForOwner(
    id: string,
    ownerGithubUserId: string,
  ): Promise<TargetAuthorizationEntity | null>;
  findByOriginForOwner(
    origin: string,
    ownerGithubUserId: string,
  ): Promise<TargetAuthorizationEntity | null>;
  listByOwner(
    ownerGithubUserId: string,
  ): Promise<TargetAuthorizationEntity[]>;
  updateStatusForOwner(
    id: string,
    ownerGithubUserId: string,
    status: AuthorizationStatus,
    verifiedAt?: Date | null,
  ): Promise<TargetAuthorizationEntity>;
  deleteForOwner(id: string, ownerGithubUserId: string): Promise<void>;
}

export interface OwnershipVerificationOutcome {
  verified: boolean;
  reason: string;
}

export interface IDomainOwnershipVerifier {
  verify(
    authorization: TargetAuthorizationEntity,
  ): Promise<OwnershipVerificationOutcome>;
}
