import * as path from 'node:path';
import { Ecosystem, ParsedDependency } from '../../domain/entities/scan.types';
import { IDependencyParser } from '../../domain/ports/server.ports';

export class NpmManifestParser implements IDependencyParser {
  readonly ecosystem: Ecosystem = 'npm';

  supports(filePath: string): boolean {
    const base = path.posix.basename(filePath);
    return (
      base === 'package.json' ||
      base === 'package-lock.json' ||
      base === 'pnpm-lock.yaml' ||
      base === 'yarn.lock'
    );
  }

  parse(filePath: string, content: string): ParsedDependency[] {
    const base = path.posix.basename(filePath);
    if (base === 'package-lock.json') {
      return this.parsePackageLock(filePath, content);
    }
    if (base === 'pnpm-lock.yaml') {
      return this.parsePnpmLock(filePath, content);
    }
    if (base === 'yarn.lock') {
      return this.parseYarnLock(filePath, content);
    }
    if (base === 'package.json') {
      return this.parsePackageJson(filePath, content);
    }
    return [];
  }

  private parsePackageJson(
    filePath: string,
    content: string,
  ): ParsedDependency[] {
    try {
      const json = JSON.parse(content) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };
      const deps: ParsedDependency[] = [];
      const combined = {
        ...(json.dependencies ?? {}),
        ...(json.devDependencies ?? {}),
      };

      for (const [name, rawVersion] of Object.entries(combined)) {
        const version = this.normalizeSemver(rawVersion);
        if (!version) continue;
        deps.push({
          name,
          version,
          ecosystem: 'npm',
          purl: this.buildPurl(name, version),
          sourceFile: filePath,
          isDirect: true,
        });
      }
      return deps;
    } catch {
      return [];
    }
  }

  private parsePackageLock(
    filePath: string,
    content: string,
  ): ParsedDependency[] {
    try {
      const json = JSON.parse(content) as {
        packages?: Record<string, { version?: string }>;
        dependencies?: Record<string, { version?: string }>;
      };
      const results = new Map<string, ParsedDependency>();

      if (json.packages) {
        const rootDirect = new Set<string>();
        const rootPkg = json.packages[''] as
          | {
              dependencies?: Record<string, string>;
              devDependencies?: Record<string, string>;
            }
          | undefined;
        for (const name of Object.keys(rootPkg?.dependencies ?? {})) {
          rootDirect.add(name);
        }
        for (const name of Object.keys(rootPkg?.devDependencies ?? {})) {
          rootDirect.add(name);
        }

        for (const [pkgPath, meta] of Object.entries(json.packages)) {
          if (!pkgPath || !meta.version) continue;
          const idx = pkgPath.lastIndexOf('node_modules/');
          if (idx === -1) continue;
          const name = pkgPath.slice(idx + 'node_modules/'.length);
          if (!name) continue;
          const purl = this.buildPurl(name, meta.version);
          if (!results.has(purl)) {
            results.set(purl, {
              name,
              version: meta.version,
              ecosystem: 'npm',
              purl,
              sourceFile: filePath,
              isDirect: rootDirect.has(name),
            });
          }
        }
      } else if (json.dependencies) {
        for (const [name, meta] of Object.entries(json.dependencies)) {
          if (!meta.version) continue;
          const purl = this.buildPurl(name, meta.version);
          results.set(purl, {
            name,
            version: meta.version,
            ecosystem: 'npm',
            purl,
            sourceFile: filePath,
            isDirect: true,
          });
        }
      }

      return Array.from(results.values());
    } catch {
      return [];
    }
  }

  private parsePnpmLock(
    filePath: string,
    content: string,
  ): ParsedDependency[] {
    const results = new Map<string, ParsedDependency>();
    const lines = content.split(/\r?\n/);
    let inPackages = false;

    for (const line of lines) {
      if (/^packages:\s*$/.test(line)) {
        inPackages = true;
        continue;
      }
      if (inPackages && /^\S/.test(line)) {
        inPackages = false;
      }
      if (!inPackages) continue;

      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const match = trimmed.match(
        /^['"]?\/?((?:@[^/@]+\/)?[^/@:(\s]+)[@/]([0-9]+\.[0-9]+\.[0-9]+[^:('\s"]*)/,
      );
      if (match) {
        const [, name, version] = match;
        const cleanVersion = version.split('_')[0];
        const purl = this.buildPurl(name, cleanVersion);
        if (!results.has(purl)) {
          results.set(purl, {
            name,
            version: cleanVersion,
            ecosystem: 'npm',
            purl,
            sourceFile: filePath,
            isDirect: false,
          });
        }
      }
    }

    return Array.from(results.values());
  }

  private parseYarnLock(
    filePath: string,
    content: string,
  ): ParsedDependency[] {
    const results = new Map<string, ParsedDependency>();
    const lines = content.split(/\r?\n/);
    let currentNames: string[] = [];

    for (const rawLine of lines) {
      if (!rawLine.trim() || rawLine.trimStart().startsWith('#')) {
        if (!rawLine.trim()) currentNames = [];
        continue;
      }

      if (!rawLine.startsWith(' ') && !rawLine.startsWith('\t')) {
        const header = rawLine.replace(/:$/, '').trim();
        if (header === '__metadata') {
          currentNames = [];
          continue;
        }
        const entries = header
          .split(',')
          .map((s) => s.trim().replace(/^["']|["']$/g, ''))
          .filter(Boolean);
        currentNames = entries
          .map((spec) => {
            const match = spec.match(/^((?:@[^@/]+\/)?[^@]+)@/);
            return match ? match[1] : null;
          })
          .filter((name): name is string => Boolean(name));
        continue;
      }

      if (currentNames.length > 0) {
        const verMatch = rawLine
          .trim()
          .match(/^version(?::|\s+)\s*["']?(\d+\.\d+\.\d+[^"'\s]*)["']?/);
        if (verMatch) {
          const version = verMatch[1];
          for (const name of currentNames) {
            const purl = this.buildPurl(name, version);
            if (!results.has(purl)) {
              results.set(purl, {
                name,
                version,
                ecosystem: 'npm',
                purl,
                sourceFile: filePath,
                isDirect: false,
              });
            }
          }
          currentNames = [];
        }
      }
    }

    return Array.from(results.values());
  }

  private normalizeSemver(raw: string): string | null {
    const trimmed = raw.trim();
    if (
      !trimmed ||
      trimmed.startsWith('workspace:') ||
      trimmed.startsWith('file:') ||
      trimmed.startsWith('git+') ||
      trimmed === '*' ||
      trimmed === 'latest'
    ) {
      return null;
    }
    const match = trimmed.match(/(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)/);
    return match ? match[1] : null;
  }

  private buildPurl(name: string, version: string): string {
    return `pkg:npm/${encodeURIComponent(name).replace('%40', '@')}@${version}`;
  }
}
