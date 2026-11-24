import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/prisma/prisma.service';
import {
  AuthorizationStatus,
  TargetAuthorizationEntity,
} from '../../domain/entities/scan.types';
import {
  CreateAuthorizationChallengeInput,
  ITargetAuthorizationRepository,
} from '../../domain/ports/target-authorization.port';

@Injectable()
export class PrismaTargetAuthorizationRepository
  implements ITargetAuthorizationRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async upsertPendingChallenge(
    input: CreateAuthorizationChallengeInput,
  ): Promise<TargetAuthorizationEntity> {
    return this.prisma.targetAuthorization.upsert({
      where: {
        ownerGithubUserId_origin: {
          ownerGithubUserId: input.ownerGithubUserId,
          origin: input.origin,
        },
      },
      create: {
        ownerGithubUserId: input.ownerGithubUserId,
        origin: input.origin,
        hostname: input.hostname,
        method: input.method,
        challengeToken: input.challengeToken,
        tokenHash: input.tokenHash,
        status: 'PENDING',
        verifiedAt: null,
        expiresAt: input.expiresAt,
      },
      update: {
        hostname: input.hostname,
        method: input.method,
        challengeToken: input.challengeToken,
        tokenHash: input.tokenHash,
        status: 'PENDING',
        verifiedAt: null,
        expiresAt: input.expiresAt,
      },
    });
  }

  async findByIdForOwner(
    id: string,
    ownerGithubUserId: string,
  ): Promise<TargetAuthorizationEntity | null> {
    return this.prisma.targetAuthorization.findFirst({
      where: { id, ownerGithubUserId },
    });
  }

  async findByOriginForOwner(
    origin: string,
    ownerGithubUserId: string,
  ): Promise<TargetAuthorizationEntity | null> {
    return this.prisma.targetAuthorization.findUnique({
      where: {
        ownerGithubUserId_origin: {
          ownerGithubUserId,
          origin,
        },
      },
    });
  }

  async listByOwner(
    ownerGithubUserId: string,
  ): Promise<TargetAuthorizationEntity[]> {
    return this.prisma.targetAuthorization.findMany({
      where: { ownerGithubUserId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async updateStatusForOwner(
    id: string,
    ownerGithubUserId: string,
    status: AuthorizationStatus,
    verifiedAt?: Date | null,
  ): Promise<TargetAuthorizationEntity> {
    return this.prisma.targetAuthorization.update({
      where: { id, ownerGithubUserId },
      data: {
        status,
        verifiedAt: verifiedAt ?? null,
      },
    });
  }

  async deleteForOwner(id: string, ownerGithubUserId: string): Promise<void> {
    await this.prisma.targetAuthorization.deleteMany({
      where: { id, ownerGithubUserId },
    });
  }
}
