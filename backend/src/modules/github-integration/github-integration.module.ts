import { Global, Module } from '@nestjs/common';
import {
  CompleteGitHubOAuthUseCase,
  GetGitHubStatusUseCase,
  ListGitHubReposUseCase,
  ResolveGitHubSessionUseCase,
  StartGitHubOAuthUseCase,
} from './application/github-integration.use-cases';
import {
  GITHUB_OAUTH_CLIENT_PORT,
  SESSION_TOKEN_CODEC_PORT,
  TOKEN_CIPHER_PORT,
} from './domain/ports/github-integration.port';
import { AesTokenCipherService } from './infrastructure/aes-token-cipher.service';
import { GitHubApiRepositoryFetcher } from './infrastructure/github-api-repository.fetcher';
import { GitHubOAuthClient } from './infrastructure/github-oauth.client';
import { SealedSessionService } from './infrastructure/sealed-session.service';
import { GitHubIntegrationController } from './presentation/github-integration.controller';
import { SessionAuthGuard } from './presentation/session-auth.guard';

@Global()
@Module({
  controllers: [GitHubIntegrationController],
  providers: [
    AesTokenCipherService,
    SealedSessionService,
    GitHubOAuthClient,
    GitHubApiRepositoryFetcher,
    SessionAuthGuard,
    { provide: TOKEN_CIPHER_PORT, useExisting: AesTokenCipherService },
    { provide: SESSION_TOKEN_CODEC_PORT, useExisting: SealedSessionService },
    { provide: GITHUB_OAUTH_CLIENT_PORT, useExisting: GitHubOAuthClient },
    GetGitHubStatusUseCase,
    StartGitHubOAuthUseCase,
    CompleteGitHubOAuthUseCase,
    ResolveGitHubSessionUseCase,
    ListGitHubReposUseCase,
  ],
  exports: [
    ResolveGitHubSessionUseCase,
    GitHubApiRepositoryFetcher,
    SessionAuthGuard,
    SESSION_TOKEN_CODEC_PORT,
    TOKEN_CIPHER_PORT,
  ],
})
export class GitHubIntegrationModule {}
