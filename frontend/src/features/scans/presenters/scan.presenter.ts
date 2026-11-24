import {
  FindingVerdict,
  ScanStatus,
  ScanSummary,
  SeverityLevel,
  VulnerabilityFinding,
} from '@/core/models/scan.models';
import {
  SEVERITY_REGISTRY,
  VERDICT_REGISTRY,
} from '../registries/finding-registries';

export interface FindingFilterCriteria {
  severity: SeverityLevel | 'ALL';
  verdict: FindingVerdict | 'ALL';
  onlyKev: boolean;
  search: string;
}

export function filterAndSortFindings(
  findings: VulnerabilityFinding[],
  criteria: FindingFilterCriteria,
): VulnerabilityFinding[] {
  const searchLower = criteria.search.trim().toLowerCase();

  return findings
    .filter((item) => {
      if (criteria.severity !== 'ALL' && item.severity !== criteria.severity) {
        return false;
      }
      if (criteria.verdict !== 'ALL' && item.verdict !== criteria.verdict) {
        return false;
      }
      if (criteria.onlyKev && !item.isKnownExploited) {
        return false;
      }
      if (searchLower) {
        const hay = `${item.packageName} ${item.cveId ?? ''} ${item.advisoryId} ${item.title}`.toLowerCase();
        if (!hay.includes(searchLower)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (a.isKnownExploited !== b.isKnownExploited) {
        return a.isKnownExploited ? -1 : 1;
      }
      const verdictDiff =
        VERDICT_REGISTRY[b.verdict].weight - VERDICT_REGISTRY[a.verdict].weight;
      if (verdictDiff !== 0) return verdictDiff;

      const sevDiff =
        SEVERITY_REGISTRY[b.severity].weight -
        SEVERITY_REGISTRY[a.severity].weight;
      if (sevDiff !== 0) return sevDiff;

      return (b.epssScore ?? 0) - (a.epssScore ?? 0);
    });
}

export interface DashboardMetrics {
  totalScans: number;
  totalDependenciesScanned: number;
  criticalAndHighTotal: number;
  confirmedActiveTotal: number;
}

export function computeDashboardMetrics(
  scans: ScanSummary[],
): DashboardMetrics {
  return scans.reduce<DashboardMetrics>(
    (acc, scan) => {
      acc.totalScans += 1;
      acc.totalDependenciesScanned += scan.totalDependencies;
      acc.criticalAndHighTotal += scan.criticalCount + scan.highCount;
      acc.confirmedActiveTotal += scan.confirmedActiveCount;
      return acc;
    },
    {
      totalScans: 0,
      totalDependenciesScanned: 0,
      criticalAndHighTotal: 0,
      confirmedActiveTotal: 0,
    },
  );
}

export interface RepositoryDisplay {
  displayName: string;
  hostLabel: string;
}

export function formatRepositoryDisplay(repositoryUrl: string): RepositoryDisplay {
  const trimmed = repositoryUrl.trim();
  if (trimmed.startsWith('manifest://')) {
    return {
      displayName: trimmed.slice('manifest://'.length) || trimmed,
      hostLabel: 'manifesto manual',
    };
  }
  try {
    const parsed = new URL(trimmed);
    const cleanPath = parsed.pathname.replace(/^\/+|\/+$/g, '').replace(/\.git$/, '');
    return {
      displayName: cleanPath || parsed.hostname,
      hostLabel: parsed.hostname,
    };
  } catch {
    return {
      displayName: trimmed,
      hostLabel: 'repositório',
    };
  }
}

export function formatTargetHost(targetUrl: string | null): string | null {
  if (!targetUrl) return null;
  try {
    return new URL(targetUrl).host;
  } catch {
    return targetUrl;
  }
}

export interface ScanHistoryFilterCriteria {
  search: string;
  status: ScanStatus | 'ALL';
  scope: 'ALL' | 'WITH_PROBES' | 'SCA_ONLY';
}

export function filterScanHistory(
  scans: ScanSummary[],
  criteria: ScanHistoryFilterCriteria,
): ScanSummary[] {
  const q = criteria.search.trim().toLowerCase();
  return scans.filter((scan) => {
    if (criteria.status !== 'ALL' && scan.status !== criteria.status) {
      return false;
    }
    if (criteria.scope === 'WITH_PROBES' && !scan.targetUrl) {
      return false;
    }
    if (criteria.scope === 'SCA_ONLY' && scan.targetUrl) {
      return false;
    }
    if (q) {
      const hay = `${scan.repositoryUrl} ${scan.branch} ${scan.targetUrl ?? ''} ${scan.ecosystems.join(' ')}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export interface OverallRiskSummary {
  label: string;
  severity: SeverityLevel;
}

export function computeOverallRisk(
  scan: Pick<
    ScanSummary,
    'criticalCount' | 'highCount' | 'mediumCount' | 'lowCount' | 'confirmedActiveCount'
  >,
): OverallRiskSummary {
  if (scan.criticalCount > 0 || scan.confirmedActiveCount > 0) {
    return { label: 'RISCO CRÍTICO', severity: 'CRITICAL' };
  }
  if (scan.highCount > 0) {
    return { label: 'RISCO ALTO', severity: 'HIGH' };
  }
  if (scan.mediumCount > 0) {
    return { label: 'RISCO MODERADO', severity: 'MEDIUM' };
  }
  if (scan.lowCount > 0) {
    return { label: 'RISCO BAIXO', severity: 'LOW' };
  }
  return { label: 'POSTURA LIMPA', severity: 'INFO' };
}
