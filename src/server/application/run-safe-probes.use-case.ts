import { randomUUID } from 'node:crypto';
import {
  NormalizedAdvisory,
  ParsedDependency,
  ProbeAuditEntry,
  ProbeResult,
  TargetAuthorizationEntity,
} from '../domain/entities/scan.types';
import {
  SsrfBlockedError,
  TargetNotAuthorizedError,
  UnsafeProbeBlockedError,
} from '../domain/errors/domain.errors';
import { AuthorizationPolicy } from '../domain/policies/authorization.policy';
import { SafeProbePolicy } from '../domain/policies/safe-probe.policy';
import {
  IControlledProbe,
  IDomainOwnershipVerifier,
} from '../domain/ports/server.ports';
import { OwnershipCertificateService } from '../infrastructure/crypto/ownership-certificate.service';
import { InMemoryProbeAuditCollector } from '../infrastructure/pentest/in-memory-audit-collector';
import {
  RateLimitedSafeHttpClient,
  SafeHttpClientOptions,
} from '../infrastructure/pentest/rate-limited-http-client.adapter';
import { SsrfDnsGuardService } from '../infrastructure/pentest/ssrf-dns-guard.service';

export interface RunSafeProbesInput {
  scanId: string;
  ownerGithubUserId: string;
  targetUrl: string;
  verificationProof: string;
  dependencies: ParsedDependency[];
  advisories: NormalizedAdvisory[];
}

export interface RunSafeProbesOutput {
  probeResults: ProbeResult[];
  auditLogs: ProbeAuditEntry[];
  matchedPackages: string[];
  renewedAuthorization?: TargetAuthorizationEntity;
}

export class RunSafeProbesUseCase {
  constructor(
    private readonly certificates: OwnershipCertificateService,
    private readonly verifier: IDomainOwnershipVerifier,
    private readonly ssrfGuard: SsrfDnsGuardService,
    private readonly probes: IControlledProbe[],
    private readonly httpOptions: SafeHttpClientOptions = {},
  ) {}

  async execute(input: RunSafeProbesInput): Promise<RunSafeProbesOutput> {
    const parsedUrl = SafeProbePolicy.parseAndValidateTargetUrl(input.targetUrl);
    const audit = new InMemoryProbeAuditCollector();

    const unsealed = this.certificates.unsealVerifiedCertificate(
      input.verificationProof,
    );

    if (!unsealed) {
      const msg =
        'Certificado criptográfico de posse ausente ou inválido. Verifique a posse do domínio em Alvos & Guardrails antes de executar Safe Probes.';
      await audit.log({
        ownerGithubUserId: input.ownerGithubUserId,
        scanId: input.scanId,
        authorizationId: null,
        targetUrl: parsedUrl.origin,
        probeId: 'guardrail:authorization',
        httpMethod: 'NONE',
        requestPath: '/',
        statusCode: null,
        durationMs: 0,
        outcome: 'BLOCKED_UNVERIFIED',
        details: msg,
      });
      throw new TargetNotAuthorizedError(msg);
    }

    let verifiedAuth = unsealed.authorization;
    let renewedAuthorization: TargetAuthorizationEntity | undefined;

    // Seamless automatic renewal when the 7-day certificate expires IF live proof (.well-known / DNS TXT) is still present!
    if (unsealed.isExpired) {
      if (
        verifiedAuth.ownerGithubUserId !== input.ownerGithubUserId ||
        verifiedAuth.origin !== parsedUrl.origin
      ) {
        throw new TargetNotAuthorizedError(
          'Certificado expirado não corresponde ao usuário autenticado ou ao alvo solicitado.',
        );
      }

      const renewStarted = Date.now();
      const recheck = await this.verifier.verify(verifiedAuth);
      const renewMs = Date.now() - renewStarted;

      if (!recheck.verified) {
        const msg = `Certificado de posse para "${parsedUrl.origin}" expirou e a revalidação automática falhou (${recheck.reason}). Publique novamente o token em Alvos & Guardrails.`;
        await audit.log({
          ownerGithubUserId: input.ownerGithubUserId,
          scanId: input.scanId,
          authorizationId: verifiedAuth.id,
          targetUrl: parsedUrl.origin,
          probeId: 'guardrail:authorization-renewal',
          httpMethod: verifiedAuth.method === 'DNS_TXT' ? 'DNS_TXT' : 'GET',
          requestPath:
            verifiedAuth.method === 'WELL_KNOWN_FILE'
              ? '/.well-known/vereditosec-verify.txt'
              : '/',
          statusCode: null,
          durationMs: renewMs,
          outcome: 'BLOCKED_UNVERIFIED',
          details: msg,
        });
        throw new TargetNotAuthorizedError(msg);
      }

      const ttlDays = Math.max(
        1,
        Number(process.env.AUTHORIZATION_TTL_DAYS ?? 7),
      );
      const verifiedAt = new Date().toISOString();
      const expiresAt = new Date(
        Date.now() + ttlDays * 24 * 60 * 60 * 1000,
      ).toISOString();
      const renewedProof = this.certificates.sealVerifiedCertificate({
        id: verifiedAuth.id,
        ownerGithubUserId: verifiedAuth.ownerGithubUserId,
        origin: verifiedAuth.origin,
        hostname: verifiedAuth.hostname,
        method: verifiedAuth.method,
        challengeToken: verifiedAuth.challengeToken,
        verifiedAt,
        expiresAt,
        createdAt: verifiedAuth.createdAt,
      });

      verifiedAuth = {
        ...verifiedAuth,
        verifiedAt,
        expiresAt,
        updatedAt: verifiedAt,
        verificationProof: renewedProof,
      };
      renewedAuthorization = verifiedAuth;

      await audit.log({
        ownerGithubUserId: input.ownerGithubUserId,
        scanId: input.scanId,
        authorizationId: verifiedAuth.id,
        targetUrl: parsedUrl.origin,
        probeId: 'guardrail:authorization-renewal',
        httpMethod: verifiedAuth.method === 'DNS_TXT' ? 'DNS_TXT' : 'GET',
        requestPath:
          verifiedAuth.method === 'WELL_KNOWN_FILE'
            ? '/.well-known/vereditosec-verify.txt'
            : '/',
        statusCode: 200,
        durationMs: renewMs,
        outcome: 'AUTHORIZATION_RENEWED',
        details: `Posse confirmada automaticamente (${recheck.reason}); certificado renovado por ${ttlDays} dia(s).`,
      });
    }

    try {
      AuthorizationPolicy.assertTargetAuthorized(
        verifiedAuth,
        parsedUrl.toString(),
        input.ownerGithubUserId,
      );
    } catch (error) {
      await audit.log({
        ownerGithubUserId: input.ownerGithubUserId,
        scanId: input.scanId,
        authorizationId: verifiedAuth.id,
        targetUrl: parsedUrl.origin,
        probeId: 'guardrail:authorization',
        httpMethod: 'NONE',
        requestPath: '/',
        statusCode: null,
        durationMs: 0,
        outcome: 'BLOCKED_UNVERIFIED',
        details: error instanceof Error ? error.message : 'Não autorizado',
      });
      throw error;
    }

    await audit.log({
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
      details: `Certificado criptográfico ${verifiedAuth.id} (${verifiedAuth.method}) validado para execução das sondas seguras.`,
    });

    const httpClient = new RateLimitedSafeHttpClient(
      this.ssrfGuard,
      audit,
      this.httpOptions,
    );

    const probeResults: ProbeResult[] = [];
    for (const probe of this.probes) {
      try {
        const res = await probe.run(
          {
            scanId: input.scanId,
            ownerGithubUserId: input.ownerGithubUserId,
            authorization: verifiedAuth,
            targetUrl: parsedUrl.origin,
            dependencies: input.dependencies,
            advisories: input.advisories,
          },
          httpClient,
        );
        probeResults.push(...res);
      } catch (error) {
        const reason =
          error instanceof Error ? error.message : 'Erro desconhecido na sonda';
        const isSecurityBlock =
          error instanceof SsrfBlockedError ||
          error instanceof UnsafeProbeBlockedError;

        probeResults.push({
          id: randomUUID(),
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
          createdAt: new Date().toISOString(),
        });

        if (isSecurityBlock) {
          break;
        }
      }
    }

    const matchedPackages = Array.from(
      new Set(
        probeResults
          .filter((r) => r.status === 'FINDING' && r.matchedPackage)
          .map((r) => r.matchedPackage!.toLowerCase()),
      ),
    );

    return {
      probeResults,
      auditLogs: audit.getEntries(),
      matchedPackages,
      renewedAuthorization,
    };
  }
}
