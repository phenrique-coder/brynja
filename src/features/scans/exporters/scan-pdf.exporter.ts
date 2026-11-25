import type { jsPDF } from 'jspdf';
import {
  ProbeOutcome,
  ScanReport,
  SeverityLevel,
} from '@/core/models/scan.models';
import {
  computeOverallRisk,
  filterAndSortFindings,
  formatRepositoryDisplay,
} from '../presenters/scan.presenter';
import {
  PROBE_OUTCOME_REGISTRY,
  SCAN_STATUS_REGISTRY,
  SEVERITY_REGISTRY,
  VERDICT_REGISTRY,
} from '../registries/finding-registries';

type RgbTuple = [number, number, number];

const PALETTE = {
  navy: [15, 23, 42] as RgbTuple,
  navySoft: [30, 41, 59] as RgbTuple,
  cyan: [6, 182, 212] as RgbTuple,
  cyanDark: [14, 116, 144] as RgbTuple,
  slateText: [15, 23, 42] as RgbTuple,
  mutedText: [71, 85, 105] as RgbTuple,
  subtleText: [100, 116, 139] as RgbTuple,
  cardBg: [248, 250, 252] as RgbTuple,
  cardBorder: [226, 232, 240] as RgbTuple,
  white: [255, 255, 255] as RgbTuple,
  emerald: [4, 120, 87] as RgbTuple,
  emeraldBg: [209, 250, 229] as RgbTuple,
  rose: [190, 18, 60] as RgbTuple,
  roseBg: [255, 228, 230] as RgbTuple,
  orange: [194, 65, 12] as RgbTuple,
  orangeBg: [255, 237, 213] as RgbTuple,
  amber: [180, 83, 9] as RgbTuple,
  amberBg: [254, 243, 199] as RgbTuple,
  sky: [3, 105, 161] as RgbTuple,
  skyBg: [224, 242, 254] as RgbTuple,
  slateBg: [241, 245, 249] as RgbTuple,
};

const SEVERITY_COLORS: Record<SeverityLevel, { fg: RgbTuple; bg: RgbTuple }> = {
  CRITICAL: { fg: PALETTE.rose, bg: PALETTE.roseBg },
  HIGH: { fg: PALETTE.orange, bg: PALETTE.orangeBg },
  MEDIUM: { fg: PALETTE.amber, bg: PALETTE.amberBg },
  LOW: { fg: PALETTE.sky, bg: PALETTE.skyBg },
  INFO: { fg: PALETTE.emerald, bg: PALETTE.emeraldBg },
};

const PROBE_COLORS: Record<ProbeOutcome, { fg: RgbTuple; bg: RgbTuple }> = {
  FINDING: { fg: PALETTE.amber, bg: PALETTE.amberBg },
  PASSED: { fg: PALETTE.emerald, bg: PALETTE.emeraldBg },
  SKIPPED: { fg: PALETTE.mutedText, bg: PALETTE.slateBg },
  ABORTED: { fg: PALETTE.rose, bg: PALETTE.roseBg },
};

/**
 * Ensures strings render cleanly with jsPDF's built-in Latin-1/WinAnsi Helvetica font
 * while preserving all Portuguese accented characters.
 */
export function sanitizePdfText(value: string): string {
  return value
    .replace(/\u2192/g, '->')
    .replace(/\u2265/g, '>=')
    .replace(/\u2264/g, '<=')
    .replace(/[\u2014\u2013]/g, '-')
    .replace(/\u00b7/g, '|')
    .replace(/\u2022/g, '-')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\s+/g, ' ')
    .replace(/[^\x20-\x7e\u00a0-\u00ff]/g, '')
    .trim();
}

function truncateText(value: string, maxLen: number): string {
  const clean = sanitizePdfText(value);
  if (clean.length <= maxLen) return clean;
  return `${clean.slice(0, maxLen - 3)}...`;
}

function drawBrynjaEmblem(doc: jsPDF, x: number, y: number, size: number) {
  // Deep Nordic slate tile with cyan border
  doc.setFillColor(...PALETTE.navySoft);
  doc.setDrawColor(...PALETTE.cyan);
  doc.setLineWidth(0.45);
  doc.roundedRect(x, y, size, size, 2.4, 2.4, 'FD');

  const cx = x + size / 2;
  const topY = y + size * 0.14;
  const shoulderY = y + size * 0.28;
  const midY = y + size * 0.56;
  const botY = y + size * 0.86;
  const halfW = size * 0.31;

  // Outer Nordic shield silhouette
  doc.setDrawColor(...PALETTE.cyan);
  doc.setLineWidth(0.55);
  doc.line(cx, topY, cx + halfW, shoulderY);
  doc.line(cx + halfW, shoulderY, cx + halfW, midY);
  doc.line(cx + halfW, midY, cx, botY);
  doc.line(cx, botY, cx - halfW, midY);
  doc.line(cx - halfW, midY, cx - halfW, shoulderY);
  doc.line(cx - halfW, shoulderY, cx, topY);

  // Interlocking chainmail diamond weave (Brynja)
  const d = size * 0.125;
  const cy = y + size * 0.49;
  doc.setDrawColor(165, 243, 252);
  doc.setLineWidth(0.38);
  const drawDiamond = (dx: number, dy: number, r: number) => {
    doc.line(dx, dy - r, dx + r, dy);
    doc.line(dx + r, dy, dx, dy + r);
    doc.line(dx, dy + r, dx - r, dy);
    doc.line(dx - r, dy, dx, dy - r);
  };
  drawDiamond(cx, cy - d * 0.85, d * 0.82);
  drawDiamond(cx - d * 0.9, cy, d * 0.72);
  drawDiamond(cx + d * 0.9, cy, d * 0.72);
  drawDiamond(cx, cy + d * 0.85, d * 0.82);

  // Center forged core point
  doc.setFillColor(...PALETTE.white);
  doc.circle(cx, cy, 0.42, 'F');
}

function drawSectionHeading(
  doc: jsPDF,
  y: number,
  numberLabel: string,
  title: string,
  subtitle: string,
  marginX: number,
): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  let cursorY = y;
  if (cursorY > pageHeight - 44) {
    doc.addPage();
    cursorY = 24;
  }

  doc.setFillColor(...PALETTE.cyan);
  doc.roundedRect(marginX, cursorY, 7, 6.2, 1.2, 1.2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...PALETTE.navy);
  doc.text(numberLabel, marginX + 3.5, cursorY + 4.3, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...PALETTE.slateText);
  doc.text(sanitizePdfText(title), marginX + 10, cursorY + 4.6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(...PALETTE.mutedText);
  doc.text(sanitizePdfText(subtitle), marginX + 10, cursorY + 9.4);

  return cursorY + 13;
}

type DocWithAutoTable = jsPDF & {
  lastAutoTable?: { finalY: number };
};

export async function buildScanReportPdf(report: ScanReport): Promise<jsPDF> {
  const [{ jsPDF: JsPdfCtor }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);

  const doc = new JsPdfCtor({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  }) as DocWithAutoTable;

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2;
  const repoDisplay = formatRepositoryDisplay(report.repositoryUrl);
  const risk = computeOverallRisk(report);
  const riskColor = SEVERITY_COLORS[risk.severity];
  const generatedAt = new Date().toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  // =========================================================================
  // 1. EXECUTIVE COVER BANNER
  // =========================================================================
  doc.setFillColor(...PALETTE.navy);
  doc.rect(0, 0, pageWidth, 44, 'F');

  // Top cyan stripe
  doc.setFillColor(...PALETTE.cyan);
  doc.rect(0, 0, pageWidth, 2.5, 'F');

  drawBrynjaEmblem(doc, marginX, 11, 11);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...PALETTE.white);
  doc.text('Brynja', marginX + 14.5, 16.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    sanitizePdfText('Relatório Executivo de Avaliação de Segurança | SCA + CVE Intel + Safe Probes'),
    marginX + 14.5,
    21.8,
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(226, 232, 240);
  doc.text(truncateText(repoDisplay.displayName, 58), marginX, 33.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    sanitizePdfText(
      `Branch: ${report.branch}  |  Status: ${SCAN_STATUS_REGISTRY[report.status].label}  |  Scan ID: ${report.id}`,
    ),
    marginX,
    38.8,
  );

  // Risk Grade Pill (top-right inside header)
  const riskBadgeW = 38;
  const riskBadgeX = pageWidth - marginX - riskBadgeW;
  doc.setFillColor(...riskColor.bg);
  doc.roundedRect(riskBadgeX, 11, riskBadgeW, 8.5, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...riskColor.fg);
  doc.text(sanitizePdfText(risk.label), riskBadgeX + riskBadgeW / 2, 16.5, {
    align: 'center',
  });

  // =========================================================================
  // 2. METADATA SUMMARY CARD
  // =========================================================================
  let cursorY = 50;
  doc.setFillColor(...PALETTE.cardBg);
  doc.setDrawColor(...PALETTE.cardBorder);
  doc.setLineWidth(0.3);
  doc.roundedRect(marginX, cursorY, contentWidth, 24, 2.5, 2.5, 'FD');

  const metaLeftX = marginX + 4;
  const metaRightX = marginX + contentWidth / 2 + 2;

  const metaPairs: Array<[number, number, string, string]> = [
    [metaLeftX, cursorY + 6.5, 'Repositório:', truncateText(report.repositoryUrl, 48)],
    [
      metaLeftX,
      cursorY + 13,
      'Alvo Staging:',
      truncateText(report.targetUrl ?? 'Não configurado (Somente SCA)', 46),
    ],
    [
      metaLeftX,
      cursorY + 19.5,
      'Ecossistemas:',
      report.ecosystems.length > 0 ? report.ecosystems.join(', ') : 'Nenhum detectado',
    ],
    [
      metaRightX,
      cursorY + 6.5,
      'Data da Avaliação:',
      new Date(report.completedAt ?? report.createdAt).toLocaleString('pt-BR'),
    ],
    [
      metaRightX,
      cursorY + 13,
      'Política de Sondas:',
      'Somente GET/HEAD não destrutivo + Anti-SSRF',
    ],
    [
      metaRightX,
      cursorY + 19.5,
      'Fontes de Inteligência:',
      'OSV.dev, NVD 2.0, FIRST EPSS, CISA KEV',
    ],
  ];

  for (const [x, y, label, val] of metaPairs) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.8);
    doc.setTextColor(...PALETTE.mutedText);
    doc.text(sanitizePdfText(label), x, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...PALETTE.slateText);
    doc.text(sanitizePdfText(val), x + 30, y);
  }

  // =========================================================================
  // 3. EXECUTIVE KPI CARDS (5 COLUMNS)
  // =========================================================================
  cursorY += 29;
  const kpiGap = 3;
  const kpiW = (contentWidth - kpiGap * 4) / 5;
  const kpiH = 20;

  const kpis: Array<{
    label: string;
    value: number;
    accent: RgbTuple;
  }> = [
    { label: 'DEPENDÊNCIAS', value: report.totalDependencies, accent: PALETTE.navySoft },
    { label: 'CRÍTICAS', value: report.criticalCount, accent: PALETTE.rose },
    { label: 'ALTAS', value: report.highCount, accent: PALETTE.orange },
    { label: 'MÉDIAS', value: report.mediumCount, accent: PALETTE.amber },
    { label: 'CONFIRMADAS', value: report.confirmedActiveCount, accent: PALETTE.cyanDark },
  ];

  kpis.forEach((kpi, idx) => {
    const x = marginX + idx * (kpiW + kpiGap);
    doc.setFillColor(...PALETTE.white);
    doc.setDrawColor(...PALETTE.cardBorder);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, cursorY, kpiW, kpiH, 2, 2, 'FD');

    // Colored top stripe
    doc.setFillColor(...kpi.accent);
    doc.rect(x + 0.5, cursorY + 0.3, kpiW - 1, 1.8, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.6);
    doc.setTextColor(...PALETTE.subtleText);
    doc.text(sanitizePdfText(kpi.label), x + 3, cursorY + 7.2);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(...kpi.accent);
    doc.text(String(kpi.value), x + 3, cursorY + 16.5);
  });

  // =========================================================================
  // 4. SEVERITY DISTRIBUTION BAR + KEV/PROBES SNAPSHOT
  // =========================================================================
  cursorY += kpiH + 6;
  const totalVulns =
    report.criticalCount +
    report.highCount +
    report.mediumCount +
    report.lowCount;
  const kevCount = report.findings.filter((f) => f.isKnownExploited).length;
  const probeFindingsCount = report.probeResults.filter(
    (p) => p.status === 'FINDING',
  ).length;
  const probePassedCount = report.probeResults.filter(
    (p) => p.status === 'PASSED',
  ).length;

  doc.setFillColor(...PALETTE.cardBg);
  doc.setDrawColor(...PALETTE.cardBorder);
  doc.roundedRect(marginX, cursorY, contentWidth, 21, 2.5, 2.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.2);
  doc.setTextColor(...PALETTE.slateText);
  doc.text(
    sanitizePdfText(`Distribuição de Vulnerabilidades (${totalVulns} achado(s) SCA)`),
    marginX + 4,
    cursorY + 6,
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.6);
  doc.setTextColor(...PALETTE.mutedText);
  doc.text(
    sanitizePdfText(
      `CISA KEV Ativas: ${kevCount}   |   Safe Probes: ${probeFindingsCount} ponto(s) fraco(s), ${probePassedCount} aprovado(s)`,
    ),
    pageWidth - marginX - 4,
    cursorY + 6,
    { align: 'right' },
  );

  // Stacked vector bar
  const barX = marginX + 4;
  const barY = cursorY + 9;
  const barW = contentWidth - 8;
  const barH = 4.2;

  doc.setFillColor(226, 232, 240);
  doc.roundedRect(barX, barY, barW, barH, 1.5, 1.5, 'F');

  if (totalVulns > 0) {
    const segments: Array<{ count: number; color: RgbTuple }> = [
      { count: report.criticalCount, color: PALETTE.rose },
      { count: report.highCount, color: PALETTE.orange },
      { count: report.mediumCount, color: PALETTE.amber },
      { count: report.lowCount, color: PALETTE.sky },
    ];
    let segX = barX;
    for (const seg of segments) {
      if (seg.count <= 0) continue;
      const w = (seg.count / totalVulns) * barW;
      doc.setFillColor(...seg.color);
      doc.rect(segX, barY, Math.max(w, 1), barH, 'F');
      segX += w;
    }
  } else {
    doc.setFillColor(...PALETTE.emerald);
    doc.roundedRect(barX, barY, barW, barH, 1.5, 1.5, 'F');
  }

  // Legend row
  const legendItems: Array<{ label: string; color: RgbTuple }> = [
    { label: `Críticas: ${report.criticalCount}`, color: PALETTE.rose },
    { label: `Altas: ${report.highCount}`, color: PALETTE.orange },
    { label: `Médias: ${report.mediumCount}`, color: PALETTE.amber },
    { label: `Baixas: ${report.lowCount}`, color: PALETTE.sky },
  ];
  let legX = barX;
  for (const item of legendItems) {
    doc.setFillColor(...item.color);
    doc.circle(legX + 1.4, cursorY + 17.3, 1.2, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...PALETTE.mutedText);
    doc.text(sanitizePdfText(item.label), legX + 4, cursorY + 18.2);
    legX += 34;
  }

  cursorY += 27;

  // Warnings box if any
  if (report.warnings.length > 0) {
    doc.setFillColor(...PALETTE.amberBg);
    doc.setDrawColor(...PALETTE.amber);
    doc.setLineWidth(0.25);
    const warningText = report.warnings
      .map((w) => `- ${sanitizePdfText(w)}`)
      .join('  ');
    const wrapped = doc.splitTextToSize(warningText, contentWidth - 8) as string[];
    const boxH = Math.max(10, wrapped.length * 4 + 5);
    doc.roundedRect(marginX, cursorY, contentWidth, boxH, 2, 2, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...PALETTE.amber);
    doc.text(wrapped, marginX + 4, cursorY + 5);
    cursorY += boxH + 5;
  }

  // =========================================================================
  // 5. SECTION 1 — SAFE PROBES RESULTS
  // =========================================================================
  cursorY = drawSectionHeading(
    doc,
    cursorY,
    '01',
    `Verificação Ativa Controlada — Safe Probes (${report.probeResults.length})`,
    'Sondas estritamente não destrutivas (GET/HEAD) executadas após verificação criptográfica de posse do domínio.',
    marginX,
  );

  if (report.probeResults.length === 0) {
    doc.setFillColor(...PALETTE.cardBg);
    doc.setDrawColor(...PALETTE.cardBorder);
    doc.roundedRect(marginX, cursorY, contentWidth, 12, 2, 2, 'FD');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(...PALETTE.mutedText);
    doc.text(
      sanitizePdfText(
        'Nenhuma sonda ativa foi executada nesta varredura (avaliação realizada somente em modo SCA).',
      ),
      marginX + 4,
      cursorY + 7.5,
    );
    cursorY += 18;
  } else {
    autoTable(doc, {
      startY: cursorY,
      margin: { left: marginX, right: marginX, top: 20, bottom: 18 },
      head: [['Desfecho', 'Sev.', 'Sonda & Título', 'Evidência & Recomendação']],
      body: report.probeResults.map((p) => [
        sanitizePdfText(PROBE_OUTCOME_REGISTRY[p.status].label),
        sanitizePdfText(SEVERITY_REGISTRY[p.severity].label),
        sanitizePdfText(`${p.title}\n[${p.probeId}]`),
        sanitizePdfText(
          `Evidência: ${truncateText(p.evidence, 220)}\nAção: ${truncateText(p.recommendation, 200)}`,
        ),
      ]),
      styles: {
        font: 'helvetica',
        fontSize: 7.5,
        cellPadding: 2.6,
        textColor: PALETTE.slateText,
        lineColor: PALETTE.cardBorder,
        lineWidth: 0.2,
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: PALETTE.navy,
        textColor: PALETTE.white,
        fontStyle: 'bold',
        fontSize: 7.8,
      },
      alternateRowStyles: {
        fillColor: PALETTE.cardBg,
      },
      columnStyles: {
        0: { cellWidth: 23, fontStyle: 'bold', halign: 'center' },
        1: { cellWidth: 16, fontStyle: 'bold', halign: 'center' },
        2: { cellWidth: 53 },
        3: { cellWidth: contentWidth - 92 },
      },
      didParseCell: (hookData) => {
        if (hookData.section !== 'body') return;
        const probe = report.probeResults[hookData.row.index];
        if (!probe) return;
        if (hookData.column.index === 0) {
          const c = PROBE_COLORS[probe.status];
          hookData.cell.styles.fillColor = c.bg;
          hookData.cell.styles.textColor = c.fg;
        }
        if (hookData.column.index === 1) {
          const c = SEVERITY_COLORS[probe.severity];
          hookData.cell.styles.fillColor = c.bg;
          hookData.cell.styles.textColor = c.fg;
        }
      },
    });
    cursorY = (doc.lastAutoTable?.finalY ?? cursorY + 20) + 8;
  }

  // =========================================================================
  // 6. SECTION 2 — PRIORITIZED VULNERABILITIES
  // =========================================================================
  const sortedFindings = filterAndSortFindings(report.findings, {
    severity: 'ALL',
    verdict: 'ALL',
    onlyKev: false,
    search: '',
  });

  cursorY = drawSectionHeading(
    doc,
    cursorY,
    '02',
    `Vulnerabilidades Priorizadas (${sortedFindings.length})`,
    'Ordenadas por exploração ativa (CISA KEV), veredito de exposição, severidade e probabilidade EPSS.',
    marginX,
  );

  if (sortedFindings.length === 0) {
    doc.setFillColor(...PALETTE.emeraldBg);
    doc.setDrawColor(...PALETTE.emerald);
    doc.roundedRect(marginX, cursorY, contentWidth, 12, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...PALETTE.emerald);
    doc.text(
      sanitizePdfText(
        'Nenhuma vulnerabilidade conhecida foi encontrada nas dependências analisadas.',
      ),
      marginX + 4,
      cursorY + 7.5,
    );
    cursorY += 18;
  } else {
    autoTable(doc, {
      startY: cursorY,
      margin: { left: marginX, right: marginX, top: 20, bottom: 18 },
      head: [
        [
          'Sev.',
          'CVE / Advisory',
          'Pacote & Correção',
          'Veredito / Métricas',
          'Resumo',
        ],
      ],
      body: sortedFindings.map((f) => {
        const metricsParts: string[] = [
          VERDICT_REGISTRY[f.verdict].label,
        ];
        if (f.isKnownExploited) metricsParts.push('[CISA KEV ATIVA]');
        if (f.cvssScore !== null) metricsParts.push(`CVSS ${f.cvssScore.toFixed(1)}`);
        if (f.epssScore !== null) {
          metricsParts.push(`EPSS ${(f.epssScore * 100).toFixed(1)}%`);
        }

        const pkgText = `${f.packageName}@${f.packageVersion}${
          f.fixedVersion ? `\n-> Atualizar >= ${f.fixedVersion}` : '\nSem correção publicada'
        }`;

        return [
          sanitizePdfText(SEVERITY_REGISTRY[f.severity].label),
          sanitizePdfText(f.cveId ?? f.advisoryId),
          sanitizePdfText(pkgText),
          sanitizePdfText(metricsParts.join('\n')),
          truncateText(f.title, 110),
        ];
      }),
      styles: {
        font: 'helvetica',
        fontSize: 7.3,
        cellPadding: 2.3,
        textColor: PALETTE.slateText,
        lineColor: PALETTE.cardBorder,
        lineWidth: 0.2,
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: PALETTE.navy,
        textColor: PALETTE.white,
        fontStyle: 'bold',
        fontSize: 7.6,
      },
      alternateRowStyles: {
        fillColor: PALETTE.cardBg,
      },
      columnStyles: {
        0: { cellWidth: 16, fontStyle: 'bold', halign: 'center' },
        1: { cellWidth: 28, fontStyle: 'bold' },
        2: { cellWidth: 42 },
        3: { cellWidth: 36 },
        4: { cellWidth: contentWidth - 122 },
      },
      didParseCell: (hookData) => {
        if (hookData.section !== 'body') return;
        const finding = sortedFindings[hookData.row.index];
        if (!finding) return;
        if (hookData.column.index === 0) {
          const c = SEVERITY_COLORS[finding.severity];
          hookData.cell.styles.fillColor = c.bg;
          hookData.cell.styles.textColor = c.fg;
        }
      },
    });
    cursorY = (doc.lastAutoTable?.finalY ?? cursorY + 20) + 8;
  }

  // =========================================================================
  // 7. SECTION 3 — AUDIT TRAIL (IF PRESENT)
  // =========================================================================
  if (report.auditLogs.length > 0) {
    cursorY = drawSectionHeading(
      doc,
      cursorY,
      '03',
      `Trilha de Auditoria de Sondas (${report.auditLogs.length} evento(s))`,
      'Registro imutável de autorizações verificadas e requisições HTTP GET/HEAD emitidas durante a avaliação.',
      marginX,
    );

    autoTable(doc, {
      startY: cursorY,
      margin: { left: marginX, right: marginX, top: 20, bottom: 18 },
      head: [['Horário', 'Desfecho', 'Requisição', 'HTTP / ms', 'Detalhes']],
      body: report.auditLogs.map((log) => [
        new Date(log.createdAt).toLocaleTimeString('pt-BR'),
        sanitizePdfText(log.outcome),
        sanitizePdfText(`${log.httpMethod} ${truncateText(log.requestPath, 32)}`),
        `${log.statusCode ?? '-'} (${log.durationMs}ms)`,
        truncateText(log.details, 95),
      ]),
      styles: {
        font: 'helvetica',
        fontSize: 7.2,
        cellPadding: 2.1,
        textColor: PALETTE.slateText,
        lineColor: PALETTE.cardBorder,
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: PALETTE.navySoft,
        textColor: PALETTE.white,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: PALETTE.cardBg,
      },
      columnStyles: {
        0: { cellWidth: 18 },
        1: { cellWidth: 28, fontStyle: 'bold' },
        2: { cellWidth: 42 },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: contentWidth - 108 },
      },
    });
    cursorY = (doc.lastAutoTable?.finalY ?? cursorY + 20) + 8;
  }

  // =========================================================================
  // 8. SECTION 4 — SBOM SUMMARY (DIRECT / TOP DEPENDENCIES)
  // =========================================================================
  if (report.dependencies.length > 0) {
    const sbomSectionNum = report.auditLogs.length > 0 ? '04' : '03';
    const maxSbomRows = 50;
    const displayedDeps = report.dependencies.slice(0, maxSbomRows);

    cursorY = drawSectionHeading(
      doc,
      cursorY,
      sbomSectionNum,
      `Inventário SBOM (${report.dependencies.length} biblioteca(s))`,
      displayedDeps.length < report.dependencies.length
        ? `Exibindo as primeiras ${maxSbomRows} bibliotecas; exporte o arquivo CycloneDX 1.5 JSON para o SBOM completo.`
        : 'Lista completa de bibliotecas identificadas nos manifestos do repositório.',
      marginX,
    );

    autoTable(doc, {
      startY: cursorY,
      margin: { left: marginX, right: marginX, top: 20, bottom: 18 },
      head: [['Biblioteca', 'Versão', 'Ecossistema', 'Arquivo de Origem']],
      body: displayedDeps.map((d) => [
        truncateText(d.name, 46),
        truncateText(d.version, 22),
        sanitizePdfText(d.ecosystem),
        truncateText(d.sourceFile, 48),
      ]),
      styles: {
        font: 'helvetica',
        fontSize: 7.3,
        cellPadding: 2,
        textColor: PALETTE.slateText,
        lineColor: PALETTE.cardBorder,
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: PALETTE.navySoft,
        textColor: PALETTE.white,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: PALETTE.cardBg,
      },
      columnStyles: {
        0: { cellWidth: 66, fontStyle: 'bold' },
        1: { cellWidth: 30 },
        2: { cellWidth: 24, halign: 'center' },
        3: { cellWidth: contentWidth - 120 },
      },
    });
  }

  // =========================================================================
  // 9. RUNNING HEADERS (PAGES 2+) & FOOTERS (ALL PAGES)
  // =========================================================================
  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);

    if (page > 1) {
      doc.setFillColor(...PALETTE.navy);
      doc.rect(0, 0, pageWidth, 12, 'F');
      doc.setFillColor(...PALETTE.cyan);
      doc.rect(0, 0, pageWidth, 1.4, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(...PALETTE.white);
      doc.text('Brynja', marginX, 8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        sanitizePdfText(
          `${truncateText(repoDisplay.displayName, 45)} | Scan ${report.id.slice(0, 8)}`,
        ),
        pageWidth - marginX,
        8,
        { align: 'right' },
      );
    }

    // Footer separator & metadata
    doc.setDrawColor(...PALETTE.cardBorder);
    doc.setLineWidth(0.25);
    doc.line(marginX, pageHeight - 12, pageWidth - marginX, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.3);
    doc.setTextColor(...PALETTE.subtleText);
    doc.text(
      sanitizePdfText(
        `Brynja | Relatório Gerado em ${generatedAt} | Avaliação Defensiva Não Destrutiva`,
      ),
      marginX,
      pageHeight - 7.5,
    );
    doc.text(
      `Página ${page} de ${totalPages}`,
      pageWidth - marginX,
      pageHeight - 7.5,
      { align: 'right' },
    );
  }

  return doc;
}

export async function downloadScanReportPdf(report: ScanReport): Promise<void> {
  const doc = await buildScanReportPdf(report);
  const slug = formatRepositoryDisplay(report.repositoryUrl)
    .displayName.replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 32);
  const filename = `brynja-relatorio-${slug || 'scan'}-${report.id.slice(0, 8)}.pdf`;
  doc.save(filename);
}
