import {
  AuthorizationStatus,
  FindingVerdict,
  ProbeOutcome,
  ScanReport,
  ScanStatus,
  SeverityLevel,
} from '@/core/models/scan.models';
import {
  ExportedReportFile,
  IReportExporter,
} from '@/core/ports/scan-gateway.port';

export interface BadgeMeta {
  label: string;
  classes: string;
  weight: number;
}

// OCP: Extensible registries replacing scattered switch/case statements (Light + Dark contrast)
export const SEVERITY_REGISTRY: Record<SeverityLevel, BadgeMeta> = {
  CRITICAL: {
    label: 'Crítica',
    classes:
      'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/40',
    weight: 5,
  },
  HIGH: {
    label: 'Alta',
    classes:
      'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/40',
    weight: 4,
  },
  MEDIUM: {
    label: 'Média',
    classes:
      'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/40',
    weight: 3,
  },
  LOW: {
    label: 'Baixa',
    classes:
      'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/40',
    weight: 2,
  },
  INFO: {
    label: 'Info',
    classes:
      'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/40',
    weight: 1,
  },
};

export const VERDICT_REGISTRY: Record<FindingVerdict, BadgeMeta> = {
  CONFIRMED_ACTIVE: {
    label: 'Confirmada em Runtime',
    classes:
      'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-500/20 dark:text-rose-200 dark:border-rose-400/50',
    weight: 3,
  },
  POTENTIALLY_EXPOSED: {
    label: 'Potencial / KEV Ativa',
    classes:
      'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-200 dark:border-amber-400/50',
    weight: 2,
  },
  DEPENDENCY_ONLY: {
    label: 'Apenas no Manifesto',
    classes:
      'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-700/40 dark:text-slate-300 dark:border-slate-600/60',
    weight: 1,
  },
};

export const SCAN_STATUS_REGISTRY: Record<ScanStatus, BadgeMeta> = {
  QUEUED: {
    label: 'Na Fila',
    classes:
      'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-700/40 dark:text-slate-200 dark:border-slate-600',
    weight: 1,
  },
  RUNNING: {
    label: 'Em Execução',
    classes:
      'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-500/15 dark:text-cyan-300 dark:border-cyan-500/40',
    weight: 2,
  },
  COMPLETED: {
    label: 'Concluído',
    classes:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/40',
    weight: 3,
  },
  FAILED: {
    label: 'Falhou',
    classes:
      'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/40',
    weight: 4,
  },
};

export const AUTH_STATUS_REGISTRY: Record<AuthorizationStatus, BadgeMeta> = {
  PENDING: {
    label: 'Pendente',
    classes:
      'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/40',
    weight: 1,
  },
  VERIFIED: {
    label: 'Verificado',
    classes:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/40',
    weight: 2,
  },
  REVOKED: {
    label: 'Revogado',
    classes:
      'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/40',
    weight: 3,
  },
};

export const PROBE_OUTCOME_REGISTRY: Record<ProbeOutcome, BadgeMeta> = {
  FINDING: {
    label: 'Ponto Fraco',
    classes:
      'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/40',
    weight: 4,
  },
  PASSED: {
    label: 'Aprovado',
    classes:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/40',
    weight: 3,
  },
  SKIPPED: {
    label: 'Ignorado',
    classes:
      'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-600/30 dark:text-slate-300 dark:border-slate-600',
    weight: 2,
  },
  ABORTED: {
    label: 'Interrompido (Guardrail)',
    classes:
      'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/40',
    weight: 1,
  },
};

export const PIPELINE_STAGES: Array<{ key: string; label: string }> = [
  { key: 'queued', label: 'Na fila' },
  { key: 'fetching_repository', label: 'Leitura do repositório' },
  { key: 'parsing_dependencies', label: 'Extração SBOM' },
  { key: 'querying_vulnerability_intel', label: 'OSV / NVD / EPSS / KEV' },
  { key: 'running_safe_probes', label: 'Safe Probes' },
  { key: 'completed', label: 'Relatório concluído' },
];

class JsonReportExporter implements IReportExporter {
  readonly format = 'json';
  readonly label = 'Exportar JSON';

  export(report: ScanReport): ExportedReportFile {
    return {
      filename: `brynja-scan-${report.id.slice(0, 8)}.json`,
      mimeType: 'application/json',
      content: JSON.stringify(report, null, 2),
    };
  }
}

class MarkdownReportExporter implements IReportExporter {
  readonly format = 'markdown';
  readonly label = 'Exportar Markdown';

  export(report: ScanReport): ExportedReportFile {
    const lines = [
      `# Relatório Brynja — ${report.repositoryUrl}`,
      ``,
      `- **Scan ID:** ${report.id}`,
      `- **Branch:** ${report.branch}`,
      `- **Alvo Staging:** ${report.targetUrl ?? 'Não informado (somente SCA)'}`,
      `- **Dependências analisadas:** ${report.totalDependencies}`,
      `- **Resumo:** ${report.criticalCount} Críticas | ${report.highCount} Altas | ${report.mediumCount} Médias | ${report.lowCount} Baixas`,
      ``,
      `## Vulnerabilidades (${report.findings.length})`,
      ...report.findings.map(
        (f) =>
          `- **[${f.severity}]** \`${f.packageName}@${f.packageVersion}\` — ${f.cveId ?? f.advisoryId} (${f.verdict})${f.fixedVersion ? ` → atualizar para \`${f.fixedVersion}\`` : ''}`,
      ),
      ``,
      `## Safe Probes (${report.probeResults.length})`,
      ...report.probeResults.map(
        (p) => `- **[${p.status}]** ${p.title} — ${p.evidence}`,
      ),
    ];

    return {
      filename: `brynja-report-${report.id.slice(0, 8)}.md`,
      mimeType: 'text/markdown',
      content: lines.join('\n'),
    };
  }
}

class CycloneDxSbomExporter implements IReportExporter {
  readonly format = 'cyclonedx';
  readonly label = 'Exportar SBOM (CycloneDX)';

  export(report: ScanReport): ExportedReportFile {
    const sbom = {
      bomFormat: 'CycloneDX',
      specVersion: '1.5',
      serialNumber: `urn:uuid:${report.id}`,
      version: 1,
      metadata: {
        timestamp: report.completedAt ?? report.createdAt,
        tools: [{ vendor: 'Brynja', name: 'Brynja Scanner', version: '1.0.0' }],
        component: {
          type: 'application',
          name: report.repositoryUrl,
        },
      },
      components: report.dependencies.map((d) => ({
        type: 'library',
        name: d.name,
        version: d.version,
        purl: d.purl,
      })),
    };

    return {
      filename: `brynja-sbom-${report.id.slice(0, 8)}.cdx.json`,
      mimeType: 'application/vnd.cyclonedx+json',
      content: JSON.stringify(sbom, null, 2),
    };
  }
}

export const REPORT_EXPORTERS: IReportExporter[] = [
  new JsonReportExporter(),
  new MarkdownReportExporter(),
  new CycloneDxSbomExporter(),
];
