import {
  Ecosystem,
  SUPPORTED_ECOSYSTEMS,
  ScanDependency,
  ScanReport,
  SeverityLevel,
  StaticAnalysisFinding,
  VulnerabilityFinding,
} from '@/core/models/scan.models';

function makeImportId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `imp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeSeverity(raw?: string | null): SeverityLevel {
  const val = (raw ?? '').trim().toUpperCase();
  if (val === 'CRITICAL' || val === 'ERROR') return val === 'CRITICAL' ? 'CRITICAL' : 'HIGH';
  if (val === 'HIGH') return 'HIGH';
  if (val === 'MEDIUM' || val === 'WARNING' || val === 'WARN') return 'MEDIUM';
  if (val === 'LOW' || val === 'NOTE') return 'LOW';
  return 'INFO';
}

function normalizeTrivyEcosystem(rawType?: string): Ecosystem {
  const t = (rawType ?? '').toLowerCase();
  if (t.includes('npm') || t.includes('yarn') || t.includes('pnpm') || t.includes('node')) return 'npm';
  if (t.includes('pip') || t.includes('poetry') || t.includes('python')) return 'PyPI';
  if (t.includes('gomod') || t === 'go') return 'Go';
  if (t.includes('cargo') || t.includes('rust')) return 'crates.io';
  if (t.includes('pom') || t.includes('gradle') || t.includes('jar') || t.includes('maven')) return 'Maven';
  if (t.includes('nuget') || t.includes('dotnet')) return 'NuGet';
  if (t.includes('composer') || t.includes('php')) return 'Packagist';
  if (t.includes('gem') || t.includes('bundler')) return 'RubyGems';
  return SUPPORTED_ECOSYSTEMS[0];
}

function countBySeverity(
  findings: VulnerabilityFinding[],
  staticFindings: StaticAnalysisFinding[],
) {
  const allSevs = [
    ...findings.map((f) => f.severity),
    ...staticFindings.map((s) => s.severity),
  ];
  return {
    criticalCount: allSevs.filter((s) => s === 'CRITICAL').length,
    highCount: allSevs.filter((s) => s === 'HIGH').length,
    mediumCount: allSevs.filter((s) => s === 'MEDIUM').length,
    lowCount: allSevs.filter((s) => s === 'LOW').length,
  };
}

function parseSarif210(
  doc: {
    runs?: Array<{
      tool?: { driver?: { name?: string; rules?: Array<{ id?: string; shortDescription?: { text?: string }; properties?: { tags?: string[] } }> } };
      results?: Array<{
        ruleId?: string;
        level?: string;
        message?: { text?: string };
        locations?: Array<{
          physicalLocation?: {
            artifactLocation?: { uri?: string };
            region?: { startLine?: number };
          };
        }>;
      }>;
    }>;
  },
  sourceLabel?: string,
): ScanReport {
  const now = new Date().toISOString();
  const staticFindings: StaticAnalysisFinding[] = [];
  const toolNames = new Set<string>();

  for (const run of doc.runs ?? []) {
    const toolName = run.tool?.driver?.name || 'SARIF Scanner';
    toolNames.add(toolName);
    const ruleMap = new Map(
      (run.tool?.driver?.rules ?? []).map((r) => [r.id ?? '', r]),
    );

    for (const res of run.results ?? []) {
      const ruleId = res.ruleId || 'sarif:rule';
      const ruleMeta = ruleMap.get(ruleId);
      const loc = res.locations?.[0]?.physicalLocation;
      const filePath = loc?.artifactLocation?.uri || 'imported-sarif';
      const lineNumber = loc?.region?.startLine ?? null;
      const tags = ruleMeta?.properties?.tags ?? [];
      const cweIds = tags
        .map((t) => t.match(/CWE-\d+/i)?.[0]?.toUpperCase())
        .filter((c): c is string => Boolean(c));

      const lowerRule = `${ruleId} ${res.message?.text ?? ''}`.toLowerCase();
      const category = lowerRule.includes('secret') || lowerRule.includes('token')
        ? 'SECRET_LEAK'
        : lowerRule.includes('docker') || lowerRule.includes('terraform') || lowerRule.includes('iac')
          ? 'IAC_MISCONFIG'
          : 'SAST_PATTERN';

      staticFindings.push({
        id: makeImportId(),
        ruleId: `${toolName}:${ruleId}`,
        category,
        severity: normalizeSeverity(res.level),
        title: ruleMeta?.shortDescription?.text || ruleId,
        description: res.message?.text || `Achado importado de ${toolName}.`,
        filePath,
        lineNumber,
        maskedSnippet: null,
        cweIds,
        recommendation: `Revisar regra "${ruleId}" reportada por ${toolName} em ${filePath}${lineNumber ? `:${lineNumber}` : ''}.`,
      });
    }
  }

  const counts = countBySeverity([], staticFindings);
  return {
    id: makeImportId(),
    repositoryUrl: `imported://sarif/${sourceLabel || Array.from(toolNames).join('+') || 'report'}`,
    branch: 'imported',
    targetUrl: null,
    authorizationId: null,
    status: 'COMPLETED',
    currentStage: 'completed',
    ecosystems: [],
    totalDependencies: 0,
    ...counts,
    confirmedActiveCount: 0,
    probeIssuesCount: 0,
    warnings: [`Importado de SARIF 2.1.0 (${Array.from(toolNames).join(', ') || 'Scanner Externo'}).`],
    errorMessage: null,
    startedAt: now,
    completedAt: now,
    createdAt: now,
    dependencies: [],
    findings: [],
    probeResults: [],
    auditLogs: [],
    staticFindings,
  };
}

function parseTrivyJson(
  doc: {
    ArtifactName?: string;
    Results?: Array<{
      Target?: string;
      Type?: string;
      Vulnerabilities?: Array<{
        VulnerabilityID?: string;
        PkgName?: string;
        InstalledVersion?: string;
        FixedVersion?: string;
        Title?: string;
        Description?: string;
        Severity?: string;
        CweIDs?: string[];
        References?: string[];
        PkgIdentifier?: { PURL?: string };
      }>;
      Misconfigurations?: Array<{
        ID?: string;
        Title?: string;
        Description?: string;
        Resolution?: string;
        Severity?: string;
        Status?: string;
      }>;
    }>;
  },
  sourceLabel?: string,
): ScanReport {
  const now = new Date().toISOString();
  const depMap = new Map<string, ScanDependency>();
  const findings: VulnerabilityFinding[] = [];
  const staticFindings: StaticAnalysisFinding[] = [];

  for (const res of doc.Results ?? []) {
    const ecosystem = normalizeTrivyEcosystem(res.Type);
    const target = res.Target || 'trivy-target';

    for (const v of res.Vulnerabilities ?? []) {
      const pkgName = v.PkgName || 'unknown';
      const pkgVer = v.InstalledVersion || '0.0.0';
      const depKey = `${ecosystem}:${pkgName}@${pkgVer}`;
      let dep = depMap.get(depKey);
      if (!dep) {
        dep = {
          id: makeImportId(),
          name: pkgName,
          version: pkgVer,
          ecosystem,
          purl: v.PkgIdentifier?.PURL || `pkg:${ecosystem.toLowerCase()}/${pkgName}@${pkgVer}`,
          sourceFile: target,
          isDirect: true,
        };
        depMap.set(depKey, dep);
      }

      const advId = v.VulnerabilityID || makeImportId();
      findings.push({
        id: makeImportId(),
        dependencyId: dep.id,
        advisoryId: advId,
        cveId: advId.startsWith('CVE-') ? advId : null,
        packageName: pkgName,
        packageVersion: pkgVer,
        ecosystem,
        title: v.Title || `${advId} in ${pkgName}@${pkgVer}`,
        description: v.Description || 'Importado de relatório Trivy JSON.',
        severity: normalizeSeverity(v.Severity),
        cvssScore: null,
        cvssVector: null,
        cweIds: v.CweIDs ?? [],
        epssScore: null,
        epssPercentile: null,
        isKnownExploited: false,
        fixedVersion: v.FixedVersion ?? null,
        references: (v.References ?? []).slice(0, 6),
        verdict: 'DEPENDENCY_ONLY',
        source: 'Trivy Import',
      });
    }

    for (const m of res.Misconfigurations ?? []) {
      if (m.Status && m.Status.toUpperCase() === 'PASS') continue;
      staticFindings.push({
        id: makeImportId(),
        ruleId: `trivy:${m.ID || 'misconfig'}`,
        category: 'IAC_MISCONFIG',
        severity: normalizeSeverity(m.Severity),
        title: m.Title || m.ID || 'Trivy Misconfiguration',
        description: m.Description || 'Achado de infraestrutura importado via Trivy.',
        filePath: target,
        lineNumber: null,
        maskedSnippet: null,
        cweIds: [],
        recommendation: m.Resolution || 'Corrigir configuração conforme recomendação Trivy.',
      });
    }
  }

  const dependencies = Array.from(depMap.values());
  const ecosystems = Array.from(new Set(dependencies.map((d) => d.ecosystem)));
  const counts = countBySeverity(findings, staticFindings);

  return {
    id: makeImportId(),
    repositoryUrl: `imported://trivy/${doc.ArtifactName || sourceLabel || 'scan'}`,
    branch: 'imported',
    targetUrl: null,
    authorizationId: null,
    status: 'COMPLETED',
    currentStage: 'completed',
    ecosystems,
    totalDependencies: dependencies.length,
    ...counts,
    confirmedActiveCount: 0,
    probeIssuesCount: 0,
    warnings: ['Importado de relatório Trivy JSON.'],
    errorMessage: null,
    startedAt: now,
    completedAt: now,
    createdAt: now,
    dependencies,
    findings,
    probeResults: [],
    auditLogs: [],
    staticFindings,
  };
}

function parseSemgrepJson(
  doc: {
    results?: Array<{
      check_id?: string;
      path?: string;
      start?: { line?: number };
      extra?: {
        severity?: string;
        message?: string;
        metadata?: { cwe?: string | string[] };
      };
    }>;
  },
  sourceLabel?: string,
): ScanReport {
  const now = new Date().toISOString();
  const staticFindings: StaticAnalysisFinding[] = (doc.results ?? []).map((r) => {
    const rawCwe = r.extra?.metadata?.cwe;
    const cweList = Array.isArray(rawCwe)
      ? rawCwe
      : typeof rawCwe === 'string'
        ? [rawCwe]
        : [];
    const cweIds = cweList
      .map((c) => c.match(/CWE-\d+/i)?.[0]?.toUpperCase())
      .filter((c): c is string => Boolean(c));

    return {
      id: makeImportId(),
      ruleId: `semgrep:${r.check_id || 'rule'}`,
      category: 'SAST_PATTERN',
      severity: normalizeSeverity(r.extra?.severity),
      title: r.check_id || 'Semgrep Finding',
      description: r.extra?.message || 'Achado SAST importado via Semgrep JSON.',
      filePath: r.path || 'semgrep-target',
      lineNumber: r.start?.line ?? null,
      maskedSnippet: null,
      cweIds,
      recommendation: `Revisar regra Semgrep "${r.check_id || 'rule'}" e aplicar correção segura.`,
    };
  });

  const counts = countBySeverity([], staticFindings);
  return {
    id: makeImportId(),
    repositoryUrl: `imported://semgrep/${sourceLabel || 'scan'}`,
    branch: 'imported',
    targetUrl: null,
    authorizationId: null,
    status: 'COMPLETED',
    currentStage: 'completed',
    ecosystems: [],
    totalDependencies: 0,
    ...counts,
    confirmedActiveCount: 0,
    probeIssuesCount: 0,
    warnings: ['Importado de relatório Semgrep JSON.'],
    errorMessage: null,
    startedAt: now,
    completedAt: now,
    createdAt: now,
    dependencies: [],
    findings: [],
    probeResults: [],
    auditLogs: [],
    staticFindings,
  };
}

function parseProwlerJson(
  items: Array<Record<string, unknown>>,
  sourceLabel?: string,
): ScanReport {
  const now = new Date().toISOString();
  const staticFindings: StaticAnalysisFinding[] = [];

  for (const item of items) {
    const statusCode = String(
      item.status_code ?? item.Status ?? item.status ?? '',
    ).toUpperCase();
    if (statusCode === 'PASS' || statusCode === 'INFO' || statusCode === 'OK') {
      continue;
    }

    const findingInfo = (item.finding_info ?? {}) as Record<string, unknown>;
    const remediation = (item.remediation ?? {}) as Record<string, unknown>;
    const title = String(
      findingInfo.title ?? item.CheckTitle ?? item.check_id ?? 'Prowler Cloud Finding',
    );
    const uid = String(
      findingInfo.uid ?? item.CheckID ?? item.check_id ?? 'prowler-check',
    );
    const desc = String(
      findingInfo.desc ?? item.StatusExtended ?? item.description ?? 'Achado cloud importado via Prowler.',
    );
    const rec = String(
      (remediation.desc as string | undefined) ?? item.Remediation ?? 'Aplicar hardening cloud recomendado pelo Prowler.',
    );
    const sevRaw = String(item.severity ?? item.Severity ?? 'MEDIUM');
    const resourcePath = String(
      item.ResourceId ?? item.resource_uid ?? item.Region ?? 'cloud-account',
    );

    staticFindings.push({
      id: makeImportId(),
      ruleId: `prowler:${uid}`,
      category: 'IAC_MISCONFIG',
      severity: normalizeSeverity(sevRaw),
      title,
      description: desc,
      filePath: resourcePath,
      lineNumber: null,
      maskedSnippet: null,
      cweIds: [],
      recommendation: rec,
    });
  }

  const counts = countBySeverity([], staticFindings);
  return {
    id: makeImportId(),
    repositoryUrl: `imported://prowler/${sourceLabel || 'cloud-audit'}`,
    branch: 'imported',
    targetUrl: null,
    authorizationId: null,
    status: 'COMPLETED',
    currentStage: 'completed',
    ecosystems: [],
    totalDependencies: 0,
    ...counts,
    confirmedActiveCount: 0,
    probeIssuesCount: 0,
    warnings: ['Importado de relatório Prowler Cloud Security (JSON/OCSF).'],
    errorMessage: null,
    startedAt: now,
    completedAt: now,
    createdAt: now,
    dependencies: [],
    findings: [],
    probeResults: [],
    auditLogs: [],
    staticFindings,
  };
}

export function parseExternalSecurityReport(
  rawJsonText: string,
  sourceLabel?: string,
): ScanReport {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJsonText);
  } catch {
    throw new Error('Arquivo JSON inválido ao tentar importar relatório externo.');
  }

  if (Array.isArray(parsed)) {
    const first = parsed[0] as Record<string, unknown> | undefined;
    if (
      first &&
      (first.finding_info !== undefined ||
        first.CheckID !== undefined ||
        first.status_code !== undefined)
    ) {
      return parseProwlerJson(parsed as Array<Record<string, unknown>>, sourceLabel);
    }
  }

  if (parsed && typeof parsed === 'object') {
    const obj = parsed as Record<string, unknown>;
    if (Array.isArray(obj.runs)) {
      return parseSarif210(obj as Parameters<typeof parseSarif210>[0], sourceLabel);
    }
    if (Array.isArray(obj.Results)) {
      return parseTrivyJson(obj as Parameters<typeof parseTrivyJson>[0], sourceLabel);
    }
    if (Array.isArray(obj.results)) {
      return parseSemgrepJson(obj as Parameters<typeof parseSemgrepJson>[0], sourceLabel);
    }
  }

  throw new Error(
    'Formato não reconhecido. Envie um relatório JSON válido de SARIF 2.1.0, Trivy, Semgrep ou Prowler.',
  );
}
