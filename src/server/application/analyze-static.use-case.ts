import {
  RepositoryFile,
  RepositoryPostureSignals,
  StaticAnalysisFinding,
} from '../domain/entities/scan.types';
import {
  IRepositoryFetcher,
  IStaticAnalyzer,
} from '../domain/ports/server.ports';
import { GitHubPostureAnalyzer } from '../infrastructure/static-analysis/github-posture.analyzer';

export interface AnalyzeStaticInput {
  repositoryUrl: string;
  branch: string;
  accessToken?: string | null;
  files?: RepositoryFile[];
}

export interface AnalyzeStaticOutput {
  staticFindings: StaticAnalysisFinding[];
  inspectedFilesCount: number;
  warnings: string[];
}

export class AnalyzeStaticUseCase {
  constructor(
    private readonly fetchers: IRepositoryFetcher[],
    private readonly analyzers: IStaticAnalyzer[],
    private readonly postureAnalyzer: GitHubPostureAnalyzer = new GitHubPostureAnalyzer(),
  ) {}

  async execute(input: AnalyzeStaticInput): Promise<AnalyzeStaticOutput> {
    const warnings: string[] = [];
    let files: RepositoryFile[] = input.files ?? [];
    let posture: RepositoryPostureSignals | null = null;

    if (files.length === 0) {
      const ctx = {
        repositoryUrl: input.repositoryUrl,
        branch: input.branch,
        accessToken: input.accessToken,
      };
      const fetcher = this.fetchers.find(
        (f) => f.supports(ctx) && typeof f.fetchStaticFiles === 'function',
      );
      if (!fetcher?.fetchStaticFiles) {
        return {
          staticFindings: [],
          inspectedFilesCount: 0,
          warnings: [
            'Análise estática (Segredos/IaC/SAST) disponível apenas para repositórios GitHub HTTPS.',
          ],
        };
      }

      const bundle = await fetcher.fetchStaticFiles(ctx);
      files = bundle.files;
      posture = bundle.posture;
      if (bundle.truncated) {
        warnings.push(
          `Análise estática inspecionou até ${files.length} arquivo(s) prioritário(s) (IaC, CI/CD, configs e código) para preservar tempo de resposta serverless.`,
        );
      }
    }

    const analyzerResults = await Promise.all(
      this.analyzers.map(async (analyzer) => {
        try {
          return await analyzer.analyze(files);
        } catch (err) {
          warnings.push(
            `Analisador estático ${analyzer.id} falhou: ${err instanceof Error ? err.message : 'erro'}`,
          );
          return [];
        }
      }),
    );

    const postureFindings = this.postureAnalyzer.analyzePosture(
      posture,
      input.repositoryUrl,
    );

    return {
      staticFindings: [...analyzerResults.flat(), ...postureFindings],
      inspectedFilesCount: files.length,
      warnings,
    };
  }
}
