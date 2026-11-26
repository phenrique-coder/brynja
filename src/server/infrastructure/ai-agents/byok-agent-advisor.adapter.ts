import {
  NormalizedAdvisory,
  ProbeResult,
  RepositoryFile,
  StaticAnalysisFinding,
} from '../../domain/entities/scan.types';
import {
  AgentRemediationPlan,
  ByokAiConfig,
  IAgentAdvisorPort,
} from '../../domain/ports/server.ports';
import { SsrfDnsGuardService } from '../pentest/ssrf-dns-guard.service';

export interface AdviseInput {
  repositoryUrl: string;
  advisories: NormalizedAdvisory[];
  probeResults: ProbeResult[];
  staticFindings?: StaticAnalysisFinding[];
  sourceFiles?: RepositoryFile[];
  byok?: ByokAiConfig | null;
}

export function computeReachabilityHints(
  advisories: NormalizedAdvisory[],
  sourceFiles: RepositoryFile[],
): string[] {
  if (advisories.length === 0 || sourceFiles.length === 0) return [];
  const vulnPkgs = Array.from(
    new Set(advisories.map((a) => a.packageName.trim()).filter((n) => n.length >= 2)),
  );
  const hits: string[] = [];

  for (const pkg of vulnPkgs) {
    const escaped = pkg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const jsImportRe = new RegExp(
      `(?:import\\s+[^;]*?from\\s+['"]${escaped}(?:/[^'"]*)?['"]|require\\(\\s*['"]${escaped}(?:/[^'"]*)?['"]\\s*\\))`,
    );
    const pyImportRe = new RegExp(
      `(?:^|\\n)\\s*(?:from\\s+${escaped}(?:\\.\\S+)?\\s+import|import\\s+${escaped}(?:\\s|$|,))`,
    );

    const matchedFiles: string[] = [];
    for (const file of sourceFiles) {
      if (jsImportRe.test(file.content) || pyImportRe.test(file.content)) {
        matchedFiles.push(file.path);
        if (matchedFiles.length >= 3) break;
      }
    }

    if (matchedFiles.length > 0) {
      hits.push(`${pkg} importado ativamente em: ${matchedFiles.join(', ')}`);
    }
  }

  return hits.slice(0, 12);
}

export class ByokAgentAdvisorAdapter implements IAgentAdvisorPort {
  readonly enabled = true;

  constructor(private readonly ssrfGuard: SsrfDnsGuardService) {}

  async adviseOnFindings(
    advisories: NormalizedAdvisory[],
    probeResults: ProbeResult[],
  ): Promise<AgentRemediationPlan | null> {
    const serverKey = process.env.BRYNJA_AI_API_KEY?.trim();
    if (!serverKey) return null;
    const provider =
      process.env.BRYNJA_AI_PROVIDER === 'gemini' ? 'gemini' : 'openai';
    return this.adviseWithByok({
      repositoryUrl: 'repository',
      advisories,
      probeResults,
      byok: {
        provider,
        apiKey: serverKey,
        model: process.env.BRYNJA_AI_MODEL?.trim() || undefined,
      },
    });
  }

  async adviseWithByok(input: AdviseInput): Promise<AgentRemediationPlan> {
    const config = this.resolveConfig(input.byok);
    const reachabilityHits = computeReachabilityHints(
      input.advisories,
      input.sourceFiles ?? [],
    );

    const prompt = this.buildSafePrompt(input, reachabilityHits);

    if (config.provider === 'gemini') {
      return this.callGemini(config, prompt, reachabilityHits);
    }

    return this.callOpenAiCompatible(config, prompt, reachabilityHits);
  }

  private resolveConfig(byok?: ByokAiConfig | null): ByokAiConfig {
    if (byok?.apiKey?.trim()) {
      return {
        provider: byok.provider,
        apiKey: byok.apiKey.trim(),
        model: byok.model?.trim() || undefined,
        endpointUrl: byok.endpointUrl?.trim() || undefined,
      };
    }

    const envKey = process.env.BRYNJA_AI_API_KEY?.trim();
    if (envKey) {
      return {
        provider:
          process.env.BRYNJA_AI_PROVIDER === 'gemini' ? 'gemini' : 'openai',
        apiKey: envKey,
        model: process.env.BRYNJA_AI_MODEL?.trim() || undefined,
      };
    }

    throw new Error(
      'Nenhuma chave de API configurada. Informe seu token OpenAI/Gemini (BYOK) no painel do relatório.',
    );
  }

  private buildSafePrompt(
    input: AdviseInput,
    reachabilityHits: string[],
  ): string {
    // Strictly send sanitized metadata only (never send raw code or secrets)
    const compactVulns = input.advisories.slice(0, 20).map((a) => ({
      pkg: `${a.ecosystem}:${a.packageName}@${a.packageVersion}`,
      id: a.cveId ?? a.advisoryId,
      severity: a.severity,
      kev: a.isKnownExploited,
      fixed: a.fixedVersion,
    }));

    const compactProbes = input.probeResults
      .filter((p) => p.status === 'FINDING')
      .slice(0, 15)
      .map((p) => ({ id: p.probeId, severity: p.severity, title: p.title }));

    const compactStatic = (input.staticFindings ?? [])
      .filter((s) => s.severity !== 'INFO')
      .slice(0, 15)
      .map((s) => ({
        rule: s.ruleId,
        category: s.category,
        severity: s.severity,
        file: s.filePath,
      }));

    return [
      'You are an AppSec triage advisor. Respond strictly with valid JSON matching {"summary": string, "prioritizedSteps": string[]} in Portuguese.',
      `Repository: ${input.repositoryUrl}`,
      `Reachability hints: ${JSON.stringify(reachabilityHits)}`,
      `Dependencies CVEs: ${JSON.stringify(compactVulns)}`,
      `Safe Probes Findings: ${JSON.stringify(compactProbes)}`,
      `Static Analysis Findings: ${JSON.stringify(compactStatic)}`,
    ].join('\n');
  }

  private parseAiJson(
    rawText: string,
    generatedBy: string,
    reachabilityHits: string[],
  ): AgentRemediationPlan {
    const cleaned = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/i, '')
      .trim();

    try {
      const parsed = JSON.parse(cleaned) as {
        summary?: unknown;
        prioritizedSteps?: unknown;
      };
      const summary =
        typeof parsed.summary === 'string' && parsed.summary.trim()
          ? parsed.summary.trim()
          : cleaned.slice(0, 600);
      const prioritizedSteps = Array.isArray(parsed.prioritizedSteps)
        ? parsed.prioritizedSteps
            .filter((s): s is string => typeof s === 'string' && Boolean(s.trim()))
            .slice(0, 10)
        : [];
      return {
        summary,
        prioritizedSteps,
        reachabilityHits,
        generatedBy,
      };
    } catch {
      return {
        summary: cleaned.slice(0, 800),
        prioritizedSteps: [],
        reachabilityHits,
        generatedBy,
      };
    }
  }

  private async callOpenAiCompatible(
    config: ByokAiConfig,
    prompt: string,
    reachabilityHits: string[],
  ): Promise<AgentRemediationPlan> {
    const endpoint =
      config.endpointUrl || 'https://api.openai.com/v1/chat/completions';
    await this.ssrfGuard.assertUrlSafeForOutboundRequest(endpoint);

    const model = config.model || 'gpt-4o-mini';
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'Return concise JSON with keys summary (string) and prioritizedSteps (string[]).',
          },
          { role: 'user', content: prompt },
        ],
      }),
      signal: AbortSignal.timeout(25_000),
    });

    if (!res.ok) {
      throw new Error(`Provedor IA retornou HTTP ${res.status}.`);
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new Error('Resposta vazia recebida do provedor IA.');
    }

    return this.parseAiJson(
      content,
      `${config.provider}:${model}`,
      reachabilityHits,
    );
  }

  private async callGemini(
    config: ByokAiConfig,
    prompt: string,
    reachabilityHits: string[],
  ): Promise<AgentRemediationPlan> {
    const model = config.model || 'gemini-2.5-flash';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(config.apiKey)}`;
    await this.ssrfGuard.assertUrlSafeForOutboundRequest(endpoint);

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      }),
      signal: AbortSignal.timeout(25_000),
    });

    if (!res.ok) {
      throw new Error(`Gemini API retornou HTTP ${res.status}.`);
    }

    const data = (await res.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) {
      throw new Error('Resposta vazia recebida da Gemini API.');
    }

    return this.parseAiJson(text, `gemini:${model}`, reachabilityHits);
  }
}
