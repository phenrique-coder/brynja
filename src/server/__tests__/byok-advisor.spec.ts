import { afterEach, describe, expect, it, vi } from 'vitest';
import { SsrfBlockedError } from '../domain/errors/domain.errors';
import {
  NormalizedAdvisory,
  ProbeResult,
  RepositoryFile,
  StaticAnalysisFinding,
} from '../domain/entities/scan.types';
import {
  ByokAgentAdvisorAdapter,
  computeReachabilityHints,
} from '../infrastructure/ai-agents/byok-agent-advisor.adapter';
import { SsrfDnsGuardService } from '../infrastructure/pentest/ssrf-dns-guard.service';

function makeAdvisory(
  overrides: Partial<NormalizedAdvisory> = {},
): NormalizedAdvisory {
  return {
    advisoryId: 'GHSA-next-001',
    cveId: 'CVE-2025-29927',
    packageName: 'next',
    packageVersion: '15.0.0',
    ecosystem: 'npm',
    title: 'Authorization Bypass in Middleware',
    description: 'Security flaw in middleware',
    severity: 'CRITICAL',
    cvssScore: 9.1,
    cvssVector: null,
    cweIds: ['CWE-285'],
    epssScore: 0.92,
    epssPercentile: 0.99,
    isKnownExploited: true,
    fixedVersion: '15.2.3',
    references: [],
    verdict: 'DEPENDENCY_ONLY',
    source: 'OSV.dev + CISA KEV',
    ...overrides,
  };
}

describe('Phase 5 BYOK AI Advisor & Reachability Analysis', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.BRYNJA_AI_API_KEY;
    delete process.env.BRYNJA_AI_PROVIDER;
  });

  it('detects JS/TS and Python active imports across source files for reachability hints', () => {
    const advisories = [
      makeAdvisory({ packageName: 'next', ecosystem: 'npm' }),
      makeAdvisory({
        advisoryId: 'PYSEC-1',
        packageName: 'requests',
        ecosystem: 'PyPI',
      }),
      makeAdvisory({
        advisoryId: 'GHSA-unused',
        packageName: 'unused-pkg',
        ecosystem: 'npm',
      }),
    ];

    const files: RepositoryFile[] = [
      {
        path: 'src/middleware.ts',
        content: `import { NextResponse } from 'next/server';\nexport function middleware() { return NextResponse.next(); }`,
      },
      {
        path: 'scripts/sync.py',
        content: `import os\nfrom requests.adapters import HTTPAdapter\n`,
      },
    ];

    const hits = computeReachabilityHints(advisories, files);
    expect(hits).toHaveLength(2);
    expect(hits[0]).toContain('next');
    expect(hits[0]).toContain('src/middleware.ts');
    expect(hits[1]).toContain('requests');
    expect(hits[1]).toContain('scripts/sync.py');
  });

  it('blocks SSRF attempts targeting loopback or cloud metadata in custom BYOK endpointUrl', async () => {
    const realGuard = new SsrfDnsGuardService(false);
    const advisor = new ByokAgentAdvisorAdapter(realGuard);
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    await expect(
      advisor.adviseWithByok({
        repositoryUrl: 'https://github.com/acme/web',
        advisories: [makeAdvisory()],
        probeResults: [],
        byok: {
          provider: 'custom',
          apiKey: 'sk-byok-test',
          endpointUrl: 'http://127.0.0.1:8080/v1/chat/completions',
        },
      }),
    ).rejects.toBeInstanceOf(SsrfBlockedError);

    await expect(
      advisor.adviseWithByok({
        repositoryUrl: 'https://github.com/acme/web',
        advisories: [makeAdvisory()],
        probeResults: [],
        byok: {
          provider: 'custom',
          apiKey: 'sk-byok-test',
          endpointUrl: 'http://169.254.169.254/latest/meta-data/',
        },
      }),
    ).rejects.toBeInstanceOf(SsrfBlockedError);

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('throws a clear validation error when neither user BYOK key nor env key is configured', async () => {
    const guard = {
      assertUrlSafeForOutboundRequest: vi.fn(),
    } as unknown as SsrfDnsGuardService;
    const advisor = new ByokAgentAdvisorAdapter(guard);

    await expect(
      advisor.adviseWithByok({
        repositoryUrl: 'https://github.com/acme/web',
        advisories: [],
        probeResults: [],
        byok: null,
      }),
    ).rejects.toThrow(/BYOK/i);
  });

  it('sends sanitized metadata (never secret snippets) to OpenAI-compatible BYOK provider and merges reachability hints', async () => {
    const guard = {
      assertUrlSafeForOutboundRequest: vi
        .fn()
        .mockResolvedValue(new URL('https://api.openai.com/v1/chat/completions')),
    } as unknown as SsrfDnsGuardService;
    const advisor = new ByokAgentAdvisorAdapter(guard);

    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  summary: 'Priorize atualização imediata de next para 15.2.3.',
                  prioritizedSteps: [
                    'Atualizar next para >= 15.2.3 (CVE-2025-29927 com KEV ativo).',
                    'Rotacionar credencial detectada em .env.production.',
                  ],
                }),
              },
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    const staticFindings: StaticAnalysisFinding[] = [
      {
        id: 'st-1',
        ruleId: 'secret:aws-access-key',
        category: 'SECRET_LEAK',
        severity: 'CRITICAL',
        title: 'AWS Key Exposed',
        description: 'DO_NOT_LEAK_DESCRIPTION_RAW_SECRET',
        filePath: '.env.production',
        lineNumber: 3,
        maskedSnippet: 'AKIA****XXXX',
        cweIds: ['CWE-798'],
        recommendation: 'Revoke key',
      },
    ];

    const probeResults: ProbeResult[] = [
      {
        id: 'probe-1',
        probeId: 'safe-probe:hsts-tls',
        title: 'HSTS Missing',
        severity: 'MEDIUM',
        status: 'FINDING',
        targetUrl: 'https://staging.acme.io',
        evidence: 'Missing header',
        recommendation: 'Add HSTS',
        matchedPackage: null,
        createdAt: '2026-11-26T10:00:00.000Z',
      },
    ];

    const plan = await advisor.adviseWithByok({
      repositoryUrl: 'https://github.com/acme/web',
      advisories: [makeAdvisory()],
      probeResults,
      staticFindings,
      sourceFiles: [
        {
          path: 'src/app.ts',
          content: `import next from 'next';`,
        },
      ],
      byok: {
        provider: 'openai',
        apiKey: 'sk-user-byok-secret-token',
        model: 'gpt-4o-mini',
      },
    });

    expect(plan.generatedBy).toBe('openai:gpt-4o-mini');
    expect(plan.summary).toContain('15.2.3');
    expect(plan.prioritizedSteps).toHaveLength(2);
    expect(plan.reachabilityHits).toEqual([
      'next importado ativamente em: src/app.ts',
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, reqInit] = fetchMock.mock.calls[0];
    const bodyText = String(reqInit?.body ?? '');
    expect(bodyText).toContain('CVE-2025-29927');
    expect(bodyText).toContain('secret:aws-access-key');
    expect(bodyText).not.toContain('AKIA****XXXX');
    expect(bodyText).not.toContain('DO_NOT_LEAK_DESCRIPTION_RAW_SECRET');
  });

  it('calls Gemini BYOK endpoint when provider is gemini', async () => {
    const guard = {
      assertUrlSafeForOutboundRequest: vi
        .fn()
        .mockResolvedValue(
          new URL('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'),
        ),
    } as unknown as SsrfDnsGuardService;
    const advisor = new ByokAgentAdvisorAdapter(guard);

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      summary: 'Plano gerado pelo Gemini BYOK.',
                      prioritizedSteps: ['Atualizar pacote crítico'],
                    }),
                  },
                ],
              },
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    const plan = await advisor.adviseWithByok({
      repositoryUrl: 'https://github.com/acme/web',
      advisories: [makeAdvisory()],
      probeResults: [],
      byok: {
        provider: 'gemini',
        apiKey: 'AIza-test-key',
      },
    });

    expect(plan.generatedBy).toBe('gemini:gemini-2.5-flash');
    expect(plan.summary).toBe('Plano gerado pelo Gemini BYOK.');
    expect(plan.prioritizedSteps).toEqual(['Atualizar pacote crítico']);
  });
});
