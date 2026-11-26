import {
  FindingVerdict,
  ProbeFinding,
  ScanReport,
  ScanStatus,
  ScanSummary,
  SeverityLevel,
  VulnerabilityFinding,
  countProbeIssues,
  resolveScanProbeIssuesCount,
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

/**
 * Returns true when a completed scan passed all dependency (SCA) and Safe Probe checks
 * with zero vulnerabilities, zero probe findings, and zero execution errors.
 */
export function isScanAllClear(
  report: Pick<ScanReport, 'status' | 'errorMessage' | 'findings' | 'probeResults'>,
): boolean {
  if (report.status !== 'COMPLETED' || Boolean(report.errorMessage)) {
    return false;
  }
  if (report.findings.length > 0) {
    return false;
  }
  return countProbeIssues(report.probeResults) === 0;
}

export interface SeverityBarSegment {
  key: 'critical' | 'high' | 'medium' | 'low' | 'probes';
  count: number;
  percentage: number;
  colorClass: string;
}

/**
 * Computes proportional width percentages for the stacked severity bar in `ScanHistoryTable`,
 * distributing Critical, High, Medium, Low, and Safe Probe issues across the total issue count.
 */
export function computeSeverityBarSegments(
  scan: Pick<
    ScanSummary,
    'criticalCount' | 'highCount' | 'mediumCount' | 'lowCount' | 'probeIssuesCount'
  > & { probeResults?: ReadonlyArray<Pick<ProbeFinding, 'status'>> },
): SeverityBarSegment[] {
  const probeIssuesCount = resolveScanProbeIssuesCount(scan);
  const entries: Array<{
    key: SeverityBarSegment['key'];
    count: number;
    colorClass: string;
  }> = [
    { key: 'critical', count: scan.criticalCount, colorClass: 'bg-rose-500' },
    { key: 'high', count: scan.highCount, colorClass: 'bg-orange-500' },
    { key: 'medium', count: scan.mediumCount, colorClass: 'bg-amber-400' },
    { key: 'low', count: scan.lowCount, colorClass: 'bg-sky-400' },
    { key: 'probes', count: probeIssuesCount, colorClass: 'bg-violet-500' },
  ];

  const total = entries.reduce((sum, entry) => sum + entry.count, 0);
  if (total <= 0) return [];

  return entries
    .filter((entry) => entry.count > 0)
    .map((entry) => ({
      key: entry.key,
      count: entry.count,
      percentage: (entry.count / total) * 100,
      colorClass: entry.colorClass,
    }));
}

export interface FormattedReferenceLink {
  url: string;
  label: string;
  origin: string;
}

function classifyReferenceUrl(parsed: URL): {
  baseLabel: string;
  detail?: string;
} {
  const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
  const path = parsed.pathname;

  if (host === 'github.com') {
    const ghsa = path.match(/(GHSA-[a-z0-9-]+)/i);
    if (path.includes('/advisories/') || path.includes('/security/advisories')) {
      return { baseLabel: 'GitHub Advisory', detail: ghsa?.[1] };
    }
    const commit = path.match(/\/commit\/([0-9a-f]{7,40})/i);
    if (commit) {
      return { baseLabel: 'GitHub Commit', detail: commit[1].slice(0, 7) };
    }
    const pr = path.match(/\/pull\/(\d+)/);
    if (pr) {
      return { baseLabel: `GitHub PR #${pr[1]}` };
    }
    const issue = path.match(/\/issues\/(\d+)/);
    if (issue) {
      return { baseLabel: `GitHub Issue #${issue[1]}` };
    }
    const release = path.match(/\/releases\/tag\/([^/]+)/);
    if (release) {
      return {
        baseLabel: 'GitHub Release',
        detail: decodeURIComponent(release[1]),
      };
    }
    const repoMatch = path.match(/^\/([^/]+\/[^/]+)/);
    return { baseLabel: 'GitHub', detail: repoMatch?.[1] };
  }

  if (host === 'nvd.nist.gov') {
    const cve = path.match(/(CVE-\d{4}-\d+)/i);
    return { baseLabel: 'NVD (NIST)', detail: cve?.[1] };
  }
  if (host === 'osv.dev') return { baseLabel: 'OSV.dev' };
  if (host === 'cve.org') return { baseLabel: 'CVE.org' };
  if (host === 'cve.mitre.org') return { baseLabel: 'MITRE CVE' };
  if (host === 'cisa.gov' || host.endsWith('.cisa.gov')) {
    return { baseLabel: 'CISA' };
  }
  if (host === 'npmjs.com') return { baseLabel: 'npm' };
  if (host === 'pypi.org') return { baseLabel: 'PyPI' };
  if (host === 'security.snyk.io' || host === 'snyk.io') {
    return { baseLabel: 'Snyk' };
  }
  if (host === 'nextjs.org') return { baseLabel: 'Next.js' };
  if (host === 'vercel.com') return { baseLabel: 'Vercel' };
  if (host === 'nodejs.org') return { baseLabel: 'Node.js' };
  if (host === 'hackerone.com') return { baseLabel: 'HackerOne' };
  if (host === 'huntr.com' || host === 'huntr.dev') {
    return { baseLabel: 'Huntr' };
  }
  if (host.endsWith('redhat.com')) return { baseLabel: 'Red Hat' };
  if (host === 'ubuntu.com') return { baseLabel: 'Ubuntu' };
  if (host.endsWith('debian.org')) return { baseLabel: 'Debian' };
  if (host === 'owasp.org') return { baseLabel: 'OWASP' };

  const lastSegment = path
    .split('/')
    .filter(Boolean)
    .pop()
    ?.slice(0, 24);
  return { baseLabel: host, detail: lastSegment };
}

export function formatReferenceLinks(
  references: string[],
  limit = 4,
): FormattedReferenceLink[] {
  const uniqueUrls: string[] = [];
  const seenUrls = new Set<string>();

  for (const raw of references) {
    const trimmed = raw.trim();
    if (!trimmed || seenUrls.has(trimmed)) continue;
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') continue;
      seenUrls.add(trimmed);
      uniqueUrls.push(trimmed);
      if (uniqueUrls.length >= limit) break;
    } catch {
      continue;
    }
  }

  const prelim = uniqueUrls.map((url) => {
    const parsed = new URL(url);
    const { baseLabel, detail } = classifyReferenceUrl(parsed);
    return {
      url,
      origin: parsed.hostname.replace(/^www\./, ''),
      baseLabel,
      detail,
    };
  });

  const labelCounts = new Map<string, number>();
  for (const item of prelim) {
    labelCounts.set(item.baseLabel, (labelCounts.get(item.baseLabel) ?? 0) + 1);
  }

  const usedFinalLabels = new Map<string, number>();

  return prelim.map((item) => {
    const needsDisambiguation = (labelCounts.get(item.baseLabel) ?? 0) > 1;
    let candidate =
      needsDisambiguation && item.detail
        ? `${item.baseLabel} (${item.detail})`
        : item.baseLabel;

    const prevCount = usedFinalLabels.get(candidate) ?? 0;
    usedFinalLabels.set(candidate, prevCount + 1);
    if (prevCount > 0) {
      candidate = `${candidate} #${prevCount + 1}`;
    }

    return {
      url: item.url,
      label: candidate,
      origin: item.origin,
    };
  });
}
