import * as path from 'node:path';
import { Ecosystem, ParsedDependency } from '../../domain/entities/scan.types';
import { IDependencyParser } from '../../domain/ports/server.ports';

export class DotNetManifestParser implements IDependencyParser {
  readonly ecosystem: Ecosystem = 'NuGet';

  supports(filePath: string): boolean {
    const base = path.posix.basename(filePath).toLowerCase();
    return base === 'packages.lock.json' || base.endsWith('.csproj');
  }

  parse(filePath: string, content: string): ParsedDependency[] {
    const base = path.posix.basename(filePath).toLowerCase();
    if (base === 'packages.lock.json') {
      return this.parsePackagesLock(filePath, content);
    }
    if (base.endsWith('.csproj')) {
      return this.parseCsproj(filePath, content);
    }
    return [];
  }

  private parsePackagesLock(
    filePath: string,
    content: string,
  ): ParsedDependency[] {
    try {
      const json = JSON.parse(content) as {
        dependencies?: Record<
          string,
          Record<string, { type?: string; resolved?: string; requested?: string }>
        >;
      };
      const results = new Map<string, ParsedDependency>();

      for (const frameworkDeps of Object.values(json.dependencies ?? {})) {
        for (const [name, meta] of Object.entries(frameworkDeps ?? {})) {
          const version = meta.resolved ?? meta.requested;
          if (!version || !/\d/.test(version)) continue;

          const key = `${name}@${version}`;
          const isDirect = meta.type?.toLowerCase() === 'direct';
          const existing = results.get(key);
          if (!existing || (!existing.isDirect && isDirect)) {
            results.set(key, {
              name,
              version,
              ecosystem: 'NuGet',
              purl: `pkg:nuget/${encodeURIComponent(name)}@${version}`,
              sourceFile: filePath,
              isDirect,
            });
          }
        }
      }

      return Array.from(results.values());
    } catch {
      return [];
    }
  }

  private parseCsproj(filePath: string, content: string): ParsedDependency[] {
    const results = new Map<string, ParsedDependency>();
    const pkgRefRegex = /<PackageReference\b([^>]*?)\/?>/gi;
    let match: RegExpExecArray | null;

    while ((match = pkgRefRegex.exec(content)) !== null) {
      const attrs = match[1];
      const name = attrs.match(/Include=["']([^"']+)["']/i)?.[1]?.trim();
      const rawVer = attrs.match(/Version=["']([^"']+)["']/i)?.[1]?.trim();
      if (!name || !rawVer) continue;

      const verMatch = rawVer.match(/(\d+\.\d+(?:\.\d+)?(?:-[0-9A-Za-z.-]+)?)/);
      if (!verMatch) continue;
      const version = verMatch[1];

      const key = `${name}@${version}`;
      if (!results.has(key)) {
        results.set(key, {
          name,
          version,
          ecosystem: 'NuGet',
          purl: `pkg:nuget/${encodeURIComponent(name)}@${version}`,
          sourceFile: filePath,
          isDirect: true,
        });
      }
    }

    return Array.from(results.values());
  }
}
