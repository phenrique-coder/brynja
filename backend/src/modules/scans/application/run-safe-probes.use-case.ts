import { Inject, Injectable } from '@nestjs/common';
import {
  NormalizedAdvisory,
  ParsedDependency,
  ProbeResult,
} from '../domain/entities/scan.types';
import {
  SsrfBlockedError,
  TargetNotAuthorizedError,
  UnsafeProbeBlockedError,
} from '../domain/errors/domain.errors';
import { AuthorizationPolicy } from '../domain/policies/authorization.policy';
import { SafeProbePolicy } from '../domain/policies/safe-probe.policy';
import {
  CONTROLLED_PROBES_PORT,
  IControlledProbe,
  IProbeAuditLogger,
  IRateLimitedHttpClient,
  PROBE_AUDIT_LOGGER_PORT,
  SAFE_HTTP_CLIENT_PORT,
} from '../domain/ports/controlled-probe.port';
import {
  ITargetAuthorizationRepository,
  TARGET_AUTHORIZATION_REPO_PORT,
} from '../domain/ports/target-authorization.port';

export interface RunSafeProbesInput {
  scanId: string;
  ownerGithubUserId: string;
  targetUrl: string;
  authorizationId: string | null;
  dependencies: ParsedDependency[];
  advisories: NormalizedAdvisory[];
}

@Injectable()
export class RunSafeProbesUseCase {
  constructor(
    @Inject(TARGET_AUTHORIZATION_REPO_PORT)
    private readonly authRepo: ITargetAuthorizationRepository,
    @Inject(CONTROLLED_PROBES_PORT)
    private readonly probes: IControlledProbe[],
    @Inject(SAFE_HTTP_CLIENT_PORT)
    private readonly httpClient: IRateLimitedHttpClient,
    @Inject(PROBE_AUDIT_LOGGER_PORT)
    private readonly auditLogger: IProbeAuditLogger,
  ) {}

  async execute(input: RunSafeProbesInput): Promise<ProbeResult[]> {
    const parsedUrl = SafeProbePolicy.parseAndValidateTargetUrl(input.targetUrl);
    const auth = input.authorizationId
      ? await this.authRepo.findByIdForOwner(
          input.authorizationId,
          input.ownerGithubUserId,
        )
      : await this.authRepo.findByOriginForOwner(
          parsedUrl.origin,
          input.ownerGithubUserId,
        );

    try {
      AuthorizationPolicy.assertTargetAuthorized(
        auth,
        parsedUrl.toString(),
        input.ownerGithubUserId,
      );
    } catch (error) {
      if (error instanceof TargetNotAuthorizedError) {
        await this.auditLogger.log({
          ownerGithubUserId: input.ownerGithubUserId,
          scanId: input.scanId,
          authorizationId: auth?.id ?? null,
          targetUrl: parsedUrl.origin,
          probeId: 'guardrail:authorization',
          httpMethod: 'NONE',
          requestPath: parsedUrl.pathname || '/',
          statusCode: null,
          durationMs: 0,
          outcome: 'BLOCKED_UNVERIFIED',
          details: error.message,
        });
      }
      throw error;
    }

    const verifiedAuth = auth!;
    await this.auditLogger.log({
      ownerGithubUserId: input.ownerGithubUserId,
      scanId: input.scanId,
      authorizationId: verifiedAuth.id,
      targetUrl: parsedUrl.origin,
      probeId: 'guardrail:authorization',
      httpMethod: 'NONE',
      requestPath: '/',
      statusCode: null,
      durationMs: 0,
      outcome: 'ALLOWED',
      details: `Autorização ${verifiedAuth.id} (${verifiedAuth.method}) validada para execução de safe probes.`,
    });

    const results: ProbeResult[] = [];

    for (const probe of this.probes) {
      try {
        const probeResults = await probe.run(
          {
            scanId: input.scanId,
            ownerGithubUserId: input.ownerGithubUserId,
            authorization: verifiedAuth,
            targetUrl: parsedUrl.origin,
            dependencies: input.dependencies,
            advisories: input.advisories,
          },
          this.httpClient,
        );
        results.push(...probeResults);
      } catch (error) {
        const reason =
          error instanceof Error ? error.message : 'Erro desconhecido na sonda';
        const isSecurityBlock =
          error instanceof SsrfBlockedError ||
          error instanceof UnsafeProbeBlockedError;

        results.push({
          probeId: probe.id,
          title: probe.title,
          severity: 'INFO',
          status: 'ABORTED',
          targetUrl: parsedUrl.origin,
          evidence: reason,
          recommendation: isSecurityBlock
            ? 'Execução interrompida pelos guardrails de segurança (SSRF / política não destrutiva).'
            : 'Verifique disponibilidade do alvo e limites de rate limiting.',
          matchedPackage: null,
        });

        if (isSecurityBlock) {
          break;
        }
      }
    }

    return results;
  }
}
