import packageJson from '../../../../package.json';
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
import { AiRemediationJsonExporter } from '../exporters/ai-remediation-json.exporter';
import {
  ComplianceControlStatus,
  buildComplianceMatrixExcel,
} from '../presenters/compliance.presenter';

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

export const COMPLIANCE_STATUS_REGISTRY: Record<
  ComplianceControlStatus,
  BadgeMeta
> = {
  COMPLIANT_EVIDENCE: {
    label: 'Conforme (Evidência Técnica)',
    classes:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/40',
    weight: 5,
  },
  MANUAL_ATTESTED: {
    label: 'Atestado (GRC)',
    classes:
      'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/15 dark:text-teal-300 dark:border-teal-500/40',
    weight: 4,
  },
  PARTIAL: {
    label: 'Parcial',
    classes:
      'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/40',
    weight: 3,
  },
  GAP_DETECTED: {
    label: 'Lacuna Detectada',
    classes:
      'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/40',
    weight: 6,
  },
  MANUAL_REQUIRED: {
    label: 'Requer Atestado Manual',
    classes:
      'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/40',
    weight: 2,
  },
  NOT_EVALUATED: {
    label: 'Não Avaliado (SCA)',
    classes:
      'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-700/40 dark:text-slate-300 dark:border-slate-600',
    weight: 1,
  },
  NOT_APPLICABLE: {
    label: 'Não Aplicável',
    classes:
      'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700',
    weight: 0,
  },
};

export const PIPELINE_STAGES: Array<{ key: string; label: string }> = [
  { key: 'queued', label: 'Na fila' },
  { key: 'fetching_repository', label: 'Leitura do repositório' },
  { key: 'parsing_dependencies', label: 'Extração SBOM' },
  { key: 'querying_vulnerability_intel', label: 'OSV / NVD / EPSS / KEV' },
  { key: 'running_static_analysis', label: 'Segredos / IaC / SAST' },
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
        tools: [{ vendor: 'Brynja', name: 'Brynja Scanner', version: packageJson.version }],
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

function severityToSarifLevel(
  severity: SeverityLevel,
): 'error' | 'warning' | 'note' {
  if (severity === 'CRITICAL' || severity === 'HIGH') return 'error';
  if (severity === 'MEDIUM') return 'warning';
  return 'note';
}

class SarifReportExporter implements IReportExporter {
  readonly format = 'sarif';
  readonly label = 'Exportar SARIF 2.1.0';

  export(report: ScanReport): ExportedReportFile {
    const rulesMap = new Map<
      string,
      {
        id: string;
        name: string;
        shortDescription: { text: string };
        helpUri?: string;
        properties: { tags: string[] };
      }
    >();

    const results: Array<{
      ruleId: string;
      level: 'error' | 'warning' | 'note';
      message: { text: string };
      locations: Array<{
        physicalLocation: {
          artifactLocation: { uri: string };
          region: { startLine: number };
        };
      }>;
    }> = [];

    for (const f of report.findings) {
      const ruleId = f.cveId ?? f.advisoryId;
      if (!rulesMap.has(ruleId)) {
        rulesMap.set(ruleId, {
          id: ruleId,
          name: `${f.packageName} (${ruleId})`,
          shortDescription: { text: f.title },
          helpUri: f.references[0],
          properties: {
            tags: ['security', 'sca', f.ecosystem, ...f.cweIds],
          },
        });
      }
      const dep = report.dependencies.find((d) => d.id === f.dependencyId);
      results.push({
        ruleId,
        level: severityToSarifLevel(f.severity),
        message: {
          text: `${f.packageName}@${f.packageVersion}: ${f.title}${f.fixedVersion ? ` (fix >= ${f.fixedVersion})` : ''}`,
        },
        locations: [
          {
            physicalLocation: {
              artifactLocation: {
                uri: dep?.sourceFile || 'package.json',
              },
              region: { startLine: 1 },
            },
          },
        ],
      });
    }

    for (const p of report.probeResults) {
      if (p.status !== 'FINDING' && p.status !== 'ABORTED') continue;
      if (!rulesMap.has(p.probeId)) {
        rulesMap.set(p.probeId, {
          id: p.probeId,
          name: p.probeId,
          shortDescription: { text: p.title },
          properties: { tags: ['security', 'dast', 'safe-probe'] },
        });
      }
      results.push({
        ruleId: p.probeId,
        level: severityToSarifLevel(p.severity),
        message: {
          text: `${p.title} — ${p.evidence}`,
        },
        locations: [
          {
            physicalLocation: {
              artifactLocation: { uri: p.targetUrl },
              region: { startLine: 1 },
            },
          },
        ],
      });
    }

    for (const s of report.staticFindings ?? []) {
      if (!rulesMap.has(s.ruleId)) {
        rulesMap.set(s.ruleId, {
          id: s.ruleId,
          name: s.ruleId,
          shortDescription: { text: s.title },
          properties: { tags: ['security', 'sast', s.category, ...s.cweIds] },
        });
      }
      results.push({
        ruleId: s.ruleId,
        level: severityToSarifLevel(s.severity),
        message: {
          text: `${s.title} — ${s.recommendation}`,
        },
        locations: [
          {
            physicalLocation: {
              artifactLocation: { uri: s.filePath },
              region: { startLine: s.lineNumber ?? 1 },
            },
          },
        ],
      });
    }

    const sarif = {
      $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
      version: '2.1.0',
      runs: [
        {
          tool: {
            driver: {
              name: 'Brynja',
              informationUri: 'https://github.com/pedro-faria/brynja',
              semanticVersion: packageJson.version,
              rules: Array.from(rulesMap.values()),
            },
          },
          results,
        },
      ],
    };

    return {
      filename: `brynja-report-${report.id.slice(0, 8)}.sarif`,
      mimeType: 'application/sarif+json',
      content: JSON.stringify(sarif, null, 2),
    };
  }
}

class SpdxSbomExporter implements IReportExporter {
  readonly format = 'spdx';
  readonly label = 'Exportar SBOM (SPDX 2.3)';

  export(report: ScanReport): ExportedReportFile {
    const docCreated =
      report.completedAt ?? report.createdAt ?? new Date().toISOString();
    const packages = report.dependencies.map((d, index) => {
      const spdxId = `SPDXRef-Package-${index + 1}`;
      const pkg: Record<string, unknown> = {
        SPDXID: spdxId,
        name: d.name,
        versionInfo: d.version,
        downloadLocation: 'NOASSERTION',
        filesAnalyzed: false,
        licenseConcluded: d.license ?? 'NOASSERTION',
        licenseDeclared: d.license ?? 'NOASSERTION',
        copyrightText: 'NOASSERTION',
      };
      if (d.purl) {
        pkg.externalRefs = [
          {
            referenceCategory: 'PACKAGE-MANAGER',
            referenceType: 'purl',
            referenceLocator: d.purl,
          },
        ];
      }
      return pkg;
    });

    const spdx = {
      spdxVersion: 'SPDX-2.3',
      dataLicense: 'CC0-1.0',
      SPDXID: 'SPDXRef-DOCUMENT',
      name: `brynja-sbom-${report.id.slice(0, 8)}`,
      documentNamespace: `https://brynja.local/spdx/${report.id}`,
      creationInfo: {
        created: docCreated,
        creators: [`Tool: Brynja-${packageJson.version}`],
      },
      packages,
      relationships: packages.map((pkg) => ({
        spdxElementId: 'SPDXRef-DOCUMENT',
        relationshipType: 'DESCRIBES',
        relatedSpdxElement: pkg.SPDXID,
      })),
    };

    return {
      filename: `brynja-sbom-${report.id.slice(0, 8)}.spdx.json`,
      mimeType: 'application/spdx+json',
      content: JSON.stringify(spdx, null, 2),
    };
  }
}

class ComplianceExcelReportExporter implements IReportExporter {
  readonly format = 'compliance-xlsx';
  readonly label = 'Exportar Matriz Excel (.xlsx)';

  export(report: ScanReport): ExportedReportFile {
    const excel = buildComplianceMatrixExcel(report, 'pt-BR');
    return {
      filename: excel.filename,
      mimeType: excel.mimeType,
      content: excel.textPreview,
      binaryContent: excel.bytes,
    };
  }
}

export const REPORT_EXPORTERS: IReportExporter[] = [
  new AiRemediationJsonExporter(),
  new JsonReportExporter(),
  new MarkdownReportExporter(),
  new CycloneDxSbomExporter(),
  new SarifReportExporter(),
  new SpdxSbomExporter(),
  new ComplianceExcelReportExporter(),
];
