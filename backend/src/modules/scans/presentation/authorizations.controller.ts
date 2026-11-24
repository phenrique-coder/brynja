import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EphemeralGitHubSession } from '../../github-integration/domain/ports/github-integration.port';
import {
  CurrentSession,
  SessionAuthGuard,
} from '../../github-integration/presentation/session-auth.guard';
import { CreateTargetAuthorizationUseCase } from '../application/create-target-authorization.use-case';
import {
  ListTargetAuthorizationsUseCase,
  RevokeTargetAuthorizationUseCase,
} from '../application/manage-target-authorizations.use-case';
import { VerifyTargetOwnershipUseCase } from '../application/verify-target-ownership.use-case';
import { TargetAuthorizationEntity } from '../domain/entities/scan.types';
import {
  CreateAuthorizationDto,
  CreateAuthorizationSchema,
  ZodValidationPipe,
} from './dto/scan.dto';

@Controller('authorizations')
@UseGuards(SessionAuthGuard)
export class AuthorizationsController {
  constructor(
    private readonly config: ConfigService,
    private readonly createChallenge: CreateTargetAuthorizationUseCase,
    private readonly verifyOwnership: VerifyTargetOwnershipUseCase,
    private readonly listAuthorizations: ListTargetAuthorizationsUseCase,
    private readonly revokeAuthorization: RevokeTargetAuthorizationUseCase,
  ) {}

  @Get()
  async list(@CurrentSession() session: EphemeralGitHubSession) {
    const items = await this.listAuthorizations.execute(session.githubUserId);
    return items.map((a) => this.serialize(a));
  }

  @Post()
  async create(
    @Body(new ZodValidationPipe(CreateAuthorizationSchema))
    dto: CreateAuthorizationDto,
    @CurrentSession() session: EphemeralGitHubSession,
  ) {
    const allowLoopback =
      String(this.config.get('ALLOW_LOCAL_LOOPBACK_TARGETS') ?? 'false')
        .toLowerCase() === 'true';

    const result = await this.createChallenge.execute({
      ownerGithubUserId: session.githubUserId,
      targetUrl: dto.targetUrl,
      method: dto.method,
      allowLocalLoopbackTargets: allowLoopback,
    });

    return {
      authorization: this.serialize(result.authorization),
      instructions: result.instructions,
    };
  }

  @Post(':id/verify')
  async verify(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentSession() session: EphemeralGitHubSession,
  ) {
    const verified = await this.verifyOwnership.execute(
      id,
      session.githubUserId,
    );
    return this.serialize(verified);
  }

  @Post(':id/revoke')
  async revoke(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentSession() session: EphemeralGitHubSession,
  ) {
    return this.revokeAuthorization.execute(id, session.githubUserId);
  }

  @Delete(':id')
  async remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentSession() session: EphemeralGitHubSession,
  ) {
    return this.revokeAuthorization.execute(id, session.githubUserId);
  }

  private serialize(entity: TargetAuthorizationEntity) {
    return {
      id: entity.id,
      origin: entity.origin,
      hostname: entity.hostname,
      method: entity.method,
      status: entity.status,
      challengeToken:
        entity.status === 'PENDING' ? entity.challengeToken : undefined,
      verifiedAt: entity.verifiedAt,
      expiresAt: entity.expiresAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
