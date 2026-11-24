export interface OsvRangeEvent {
  introduced?: string;
  fixed?: string;
  last_affected?: string;
}

export interface OsvAffectedRange {
  type?: string;
  events?: OsvRangeEvent[];
}

export interface OsvAffectedPackage {
  package?: { name?: string; ecosystem?: string };
  ranges?: OsvAffectedRange[];
}

interface ParsedVersion {
  core: number[];
  prerelease: Array<number | string>;
}

function parseVersion(raw: string): ParsedVersion | null {
  const clean = raw.trim().replace(/^v/i, '').split('+')[0];
  if (!clean) return null;

  const hyphenIdx = clean.indexOf('-');
  const coreStr = hyphenIdx === -1 ? clean : clean.slice(0, hyphenIdx);
  const preStr = hyphenIdx === -1 ? '' : clean.slice(hyphenIdx + 1);

  const coreParts = coreStr.split('.');
  if (coreParts.length === 0 || coreParts.some((p) => !/^\d+$/.test(p))) {
    return null;
  }

  const core = coreParts.map((p) => Number(p));
  const prerelease = preStr
    ? preStr
        .split('.')
        .filter(Boolean)
        .map((seg) => (/^\d+$/.test(seg) ? Number(seg) : seg))
    : [];

  return { core, prerelease };
}

export function compareVersions(aRaw: string, bRaw: string): number | null {
  const a = parseVersion(aRaw);
  const b = parseVersion(bRaw);
  if (!a || !b) return null;

  const maxLen = Math.max(a.core.length, b.core.length);
  for (let i = 0; i < maxLen; i++) {
    const va = a.core[i] ?? 0;
    const vb = b.core[i] ?? 0;
    if (va !== vb) return va < vb ? -1 : 1;
  }

  if (a.prerelease.length === 0 && b.prerelease.length === 0) return 0;
  if (a.prerelease.length === 0) return 1;
  if (b.prerelease.length === 0) return -1;

  const maxPre = Math.max(a.prerelease.length, b.prerelease.length);
  for (let i = 0; i < maxPre; i++) {
    const pa = a.prerelease[i];
    const pb = b.prerelease[i];
    if (pa === undefined) return -1;
    if (pb === undefined) return 1;
    if (typeof pa === 'number' && typeof pb === 'number') {
      if (pa !== pb) return pa < pb ? -1 : 1;
    } else if (typeof pa === 'number') {
      return -1;
    } else if (typeof pb === 'number') {
      return 1;
    } else if (pa !== pb) {
      return pa < pb ? -1 : 1;
    }
  }

  return 0;
}

export function resolveFixedVersionForInstalled(
  affectedList: OsvAffectedPackage[] | undefined,
  packageName: string,
  installedVersion: string,
  ecosystem?: string,
): string | null {
  const candidates: string[] = [];

  for (const affected of affectedList ?? []) {
    if (
      affected.package?.name &&
      affected.package.name.toLowerCase() !== packageName.toLowerCase()
    ) {
      continue;
    }
    if (
      ecosystem &&
      affected.package?.ecosystem &&
      affected.package.ecosystem.toLowerCase() !== ecosystem.toLowerCase()
    ) {
      continue;
    }

    for (const range of affected.ranges ?? []) {
      if (range.type && range.type.toUpperCase() === 'GIT') {
        continue;
      }

      let activeIntroduced: string | null = null;
      for (const event of range.events ?? []) {
        if (event.introduced !== undefined) {
          activeIntroduced = event.introduced;
          continue;
        }

        if (event.last_affected !== undefined) {
          activeIntroduced = null;
          continue;
        }

        if (event.fixed !== undefined) {
          const fixed = event.fixed;
          const cmpFixed = compareVersions(installedVersion, fixed);
          const aboveIntro =
            activeIntroduced === null ||
            activeIntroduced === '0' ||
            (compareVersions(installedVersion, activeIntroduced) ?? 0) >= 0;

          if (aboveIntro && cmpFixed !== null && cmpFixed < 0) {
            candidates.push(fixed);
          }
          activeIntroduced = null;
        }
      }
    }
  }

  if (candidates.length === 0) return null;

  const installedParsed = parseVersion(installedVersion);
  const installedMajor = installedParsed?.core[0];

  candidates.sort((a, b) => compareVersions(a, b) ?? 0);

  if (installedMajor !== undefined) {
    const sameMajor = candidates.find(
      (c) => parseVersion(c)?.core[0] === installedMajor,
    );
    if (sameMajor) return sameMajor;
  }

  return candidates[0];
}
