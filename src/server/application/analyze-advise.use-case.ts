import {
  NormalizedAdvisory,
  ProbeResult,
  RepositoryFile,
  StaticAnalysisFinding,
} from '../domain/entities/scan.types';
import {
  AgentRemediationPlan,
  ByokAiConfig,
  IRepositoryFetcher,
} from '../domain/ports/server.ports';
import { ByokAgentAdvisorAdapter } from '../infrastructure/ai-agents/byok-agent-advisor.adapter';

export interface AnalyzeAdviseInput {
  repositoryUrl: string;
  branch: string;
  accessToken?: string | null;
  advisories: NormalizedAdvisory[];
  probeResults: ProbeResult[];
  staticFindings?: StaticAnalysisFinding[];
  byok?: ByokAiConfig | null;
}

export class AnalyzeAdviseUseCase {
  constructor(
    private readonly fetchers: IRepositoryFetcher[],
    private readonly advisor: ByokAgentAdvisorAdapter,
  ) {}

  async execute(input: AnalyzeAdviseInput): Promise<{ plan: AgentRemediationPlan }> {
    let sourceFiles: RepositoryFile[] = [];

    if (input.advisories.length > 0 && /^https:\/\/github\.com\//i.test(input.repositoryUrl)) {
      const ctx = {
        repositoryUrl: input.repositoryUrl,
        branch: input.branch,
        accessToken: input.accessToken,
      };
      const fetcher = this.fetchers.find(
        (f) => f.supports(ctx) && typeof f.fetchStaticFiles === 'function',
      );
      if (fetcher?.fetchStaticFiles) {
        try {
          const bundle = await fetcher.fetchStaticFiles(ctx);
          sourceFiles = bundle.files;
        } catch {
          sourceFiles = [];
        }
      }
    }

    const plan = await this.advisor.adviseWithByok({
      repositoryUrl: input.repositoryUrl,
      advisories: input.advisories,
      probeResults: input.probeResults,
      staticFindings: input.staticFindings,
      sourceFiles,
      byok: input.byok,
    });

    return { plan };
  }
}
