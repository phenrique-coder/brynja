export type XlsxStyleId = 0 | 1 | 2 | 3 | 4 | 5;

export interface XlsxCell {
  value: string | number;
  style?: XlsxStyleId;
}

export interface XlsxSheetSpec {
  name: string;
  rows: XlsxCell[][];
}

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let j = 0; j < 8; j += 1) {
      c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) {
    crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const UTF8_ENCODER = new TextEncoder();

function encodeUtf8(text: string): Uint8Array {
  return UTF8_ENCODER.encode(text);
}

/**
 * Strips XML 1.0 forbidden control characters while preserving tab/newline/carriage return.
 */
function stripInvalidXmlChars(text: string): string {
  return text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, '');
}

function escapeXml(text: string): string {
  return stripInvalidXmlChars(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function neutralizeSpreadsheetFormula(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

function sanitizeSheetName(rawName: string, index: number, used: Set<string>): string {
  let cleaned = stripInvalidXmlChars(rawName)
    .replace(/[\[\]:*?/\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 31);
  if (!cleaned) cleaned = `Sheet${index + 1}`;
  let candidate = cleaned;
  let suffix = 2;
  while (used.has(candidate.toLowerCase())) {
    const tag = ` (${suffix})`;
    candidate = `${cleaned.slice(0, 31 - tag.length)}${tag}`;
    suffix += 1;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}

function toExcelColumnName(colIndexZeroBased: number): string {
  let n = colIndexZeroBased + 1;
  let col = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    col = String.fromCharCode(65 + rem) + col;
    n = Math.floor((n - 1) / 26);
  }
  return col;
}

function buildWorksheetXml(rows: XlsxCell[][]): string {
  const maxCols = rows.reduce((max, r) => Math.max(max, r.length), 0);
  const colWidths = new Array<number>(maxCols).fill(14);

  for (const row of rows) {
    row.forEach((cell, cIdx) => {
      const str = String(cell.value ?? '');
      const longestLine = str
        .split(/\r?\n/)
        .reduce((m, line) => Math.max(m, line.length), 0);
      colWidths[cIdx] = Math.min(58, Math.max(colWidths[cIdx], longestLine + 3));
    });
  }

  const colsXml =
    maxCols > 0
      ? `<cols>${colWidths
          .map(
            (w, idx) =>
              `<col min="${idx + 1}" max="${idx + 1}" width="${w}" customWidth="1"/>`,
          )
          .join('')}</cols>`
      : '';

  const rowsXml = rows
    .map((row, rIdx) => {
      const rowNum = rIdx + 1;
      const cellsXml = row
        .map((cell, cIdx) => {
          const ref = `${toExcelColumnName(cIdx)}${rowNum}`;
          const styleAttr = cell.style ? ` s="${cell.style}"` : '';
          if (typeof cell.value === 'number' && Number.isFinite(cell.value)) {
            return `<c r="${ref}"${styleAttr}><v>${cell.value}</v></c>`;
          }
          const safeText = neutralizeSpreadsheetFormula(String(cell.value ?? ''));
          return `<c r="${ref}" t="inlineStr"${styleAttr}><is><t xml:space="preserve">${escapeXml(safeText)}</t></is></c>`;
        })
        .join('');
      return `<row r="${rowNum}">${cellsXml}</row>`;
    })
    .join('');

  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    colsXml +
    `<sheetData>${rowsXml}</sheetData>` +
    '</worksheet>'
  );
}

function buildStylesXml(): string {
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<fonts count="5">' +
    '<font><sz val="10"/><color rgb="FF0F172A"/><name val="Calibri"/></font>' +
    '<font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>' +
    '<font><b/><sz val="10"/><color rgb="FF166534"/><name val="Calibri"/></font>' +
    '<font><b/><sz val="10"/><color rgb="FFBE123C"/><name val="Calibri"/></font>' +
    '<font><b/><sz val="10"/><color rgb="FFB45309"/><name val="Calibri"/></font>' +
    '</fonts>' +
    '<fills count="7">' +
    '<fill><patternFill patternType="none"/></fill>' +
    '<fill><patternFill patternType="gray125"/></fill>' +
    '<fill><patternFill patternType="solid"><fgColor rgb="FF0F172A"/></patternFill></fill>' +
    '<fill><patternFill patternType="solid"><fgColor rgb="FFDCFCE7"/></patternFill></fill>' +
    '<fill><patternFill patternType="solid"><fgColor rgb="FFFFE4E6"/></patternFill></fill>' +
    '<fill><patternFill patternType="solid"><fgColor rgb="FFFEF3C7"/></patternFill></fill>' +
    '<fill><patternFill patternType="solid"><fgColor rgb="FFF1F5F9"/></patternFill></fill>' +
    '</fills>' +
    '<borders count="2">' +
    '<border><left/><right/><top/><bottom/><diagonal/></border>' +
    '<border><left style="thin"><color rgb="FFE2E8F0"/></left><right style="thin"><color rgb="FFE2E8F0"/></right><top style="thin"><color rgb="FFE2E8F0"/></top><bottom style="thin"><color rgb="FFE2E8F0"/></bottom><diagonal/></border>' +
    '</borders>' +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
    '<cellXfs count="6">' +
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>' +
    '<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>' +
    '<xf numFmtId="0" fontId="2" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>' +
    '<xf numFmtId="0" fontId="3" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>' +
    '<xf numFmtId="0" fontId="4" fillId="5" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>' +
    '<xf numFmtId="0" fontId="0" fillId="6" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>' +
    '</cellXfs>' +
    '</styleSheet>'
  );
}

function buildZipStoreArchive(
  entries: Array<{ name: string; bytes: Uint8Array }>,
): Uint8Array {
  const localChunks: Uint8Array[] = [];
  const centralChunks: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = encodeUtf8(entry.name);
    const dataBytes = entry.bytes;
    const crc = crc32(dataBytes);

    const localHeader = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(localHeader.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true); // version needed
    lv.setUint16(6, 0x0800, true); // UTF-8 filename flag
    lv.setUint16(8, 0, true); // Store (no compression)
    lv.setUint16(10, 0, true);
    lv.setUint16(12, 0x5421, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, dataBytes.length, true);
    lv.setUint32(22, dataBytes.length, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(centralHeader.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0x0800, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0x5421, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, dataBytes.length, true);
    cv.setUint32(24, dataBytes.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);

    localChunks.push(localHeader, dataBytes);
    centralChunks.push(centralHeader);
    offset += localHeader.length + dataBytes.length;
  }

  const centralSize = centralChunks.reduce((sum, c) => sum + c.length, 0);
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  const totalLen = offset + centralSize + eocd.length;
  const output = new Uint8Array(totalLen);
  let pos = 0;
  for (const chunk of localChunks) {
    output.set(chunk, pos);
    pos += chunk.length;
  }
  for (const chunk of centralChunks) {
    output.set(chunk, pos);
    pos += chunk.length;
  }
  output.set(eocd, pos);
  return output;
}

/**
 * Generates a native multi-worksheet OOXML `.xlsx` binary archive without third-party dependencies.
 */
export function buildXlsxWorkbookBytes(sheets: XlsxSheetSpec[]): Uint8Array {
  const usedNames = new Set<string>();
  const normalizedSheets = sheets.map((s, idx) => ({
    name: sanitizeSheetName(s.name, idx, usedNames),
    rows: s.rows,
  }));

  const contentTypesXml =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
    '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
    normalizedSheets
      .map(
        (_, i) =>
          `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
      )
      .join('') +
    '</Types>';

  const rootRelsXml =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
    '</Relationships>';

  const workbookRelsXml =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    normalizedSheets
      .map(
        (_, i) =>
          `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`,
      )
      .join('') +
    `<Relationship Id="rId${normalizedSheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
    '</Relationships>';

  const workbookXml =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    '<sheets>' +
    normalizedSheets
      .map(
        (s, i) =>
          `<sheet name="${escapeXml(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`,
      )
      .join('') +
    '</sheets>' +
    '</workbook>';

  const entries: Array<{ name: string; bytes: Uint8Array }> = [
    { name: '[Content_Types].xml', bytes: encodeUtf8(contentTypesXml) },
    { name: '_rels/.rels', bytes: encodeUtf8(rootRelsXml) },
    { name: 'xl/workbook.xml', bytes: encodeUtf8(workbookXml) },
    { name: 'xl/_rels/workbook.xml.rels', bytes: encodeUtf8(workbookRelsXml) },
    { name: 'xl/styles.xml', bytes: encodeUtf8(buildStylesXml()) },
    ...normalizedSheets.map((s, i) => ({
      name: `xl/worksheets/sheet${i + 1}.xml`,
      bytes: encodeUtf8(buildWorksheetXml(s.rows)),
    })),
  ];

  return buildZipStoreArchive(entries);
}
