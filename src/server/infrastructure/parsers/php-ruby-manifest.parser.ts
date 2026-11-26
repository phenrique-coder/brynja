import * as path from 'node:path';
import { Ecosystem, ParsedDependency } from '../../domain/entities/scan.types';
import { IDependencyParser } from '../../domain/ports/server.ports';

export class PhpComposerParser implements IDependencyParser {
  readonly ecosystem: Ecosystem = 'Packagist';

  supports(filePath: string): boolean {
    const base = path.posix.basename(filePath);
    return base === 'composer.json' || base === 'composer.lock';
  }

  parse(filePath: string, content: string): ParsedDependency[] {
    const base = path.posix.basename(filePath);
    if (base === 'composer.lock') {
      return this.parseComposerLock(filePath, content);
    }
    if (base === 'composer.json') {
      return this.parseComposerJson(filePath, content);
    }
    return [];
  }

  private parseComposerLock(
    filePath: string,
    content: string,
  ): ParsedDependency[] {
    try {
      const json = JSON.parse(content) as {
        packages?: Array<{ name?: string; version?: string }>;
        'packages-dev'?: Array<{ name?: string; version?: string }>;
      };
      const results = new Map<string, ParsedDependency>();
      const all = [...(json.packages ?? []), ...(json['packages-dev'] ?? [])];

      for (const pkg of all) {
        if (!pkg.name || !pkg.version) continue;
        const cleanVer = pkg.version.replace(/^v/i, '').trim();
        if (!/\d/.test(cleanVer)) continue;
        const key = `${pkg.name}@${cleanVer}`;
        if (!results.has(key)) {
          results.set(key, {
            name: pkg.name,
            version: cleanVer,
            ecosystem: 'Packagist',
            purl: `pkg:composer/${pkg.name}@${cleanVer}`,
            sourceFile: filePath,
            isDirect: false,
          });
        }
      }

      return Array.from(results.values());
    } catch {
      return [];
    }
  }

  private parseComposerJson(
    filePath: string,
    content: string,
  ): ParsedDependency[] {
    try {
      const json = JSON.parse(content) as {
        require?: Record<string, string>;
        'require-dev'?: Record<string, string>;
      };
      const results = new Map<string, ParsedDependency>();
      const combined = {
        ...(json.require ?? {}),
        ...(json['require-dev'] ?? {}),
      };

      for (const [name, rawVer] of Object.entries(combined)) {
        if (name === 'php' || name.startsWith('ext-') || !name.includes('/')) {
          continue;
        }
        const verMatch = rawVer.match(/(\d+\.\d+(?:\.\d+)?)/);
        if (!verMatch) continue;
        const version = verMatch[1];
        const key = `${name}@${version}`;
        if (!results.has(key)) {
          results.set(key, {
            name,
            version,
            ecosystem: 'Packagist',
            purl: `pkg:composer/${name}@${version}`,
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
}

export class RubyGemfileParser implements IDependencyParser {
  readonly ecosystem: Ecosystem = 'RubyGems';

  supports(filePath: string): boolean {
    return path.posix.basename(filePath) === 'Gemfile.lock';
  }

  parse(filePath: string, content: string): ParsedDependency[] {
    const results = new Map<string, ParsedDependency>();
    const lines = content.split(/\r?\n/);
    let inSpecs = false;

    for (const rawLine of lines) {
      const trimmed = rawLine.trim();
      if (trimmed === 'specs:') {
        inSpecs = true;
        continue;
      }
      if (inSpecs && !rawLine.startsWith(' ')) {
        inSpecs = false;
      }
      if (!inSpecs) continue;

      // Top-level resolved gems in Gemfile.lock specs block are indented by 4 spaces
      const match = rawLine.match(
        /^    ([A-Za-z0-9_.-]+)\s+\((\d+\.\d+(?:\.\d+)?[^)]*)\)$/,
      );
      if (!match) continue;

      const [, name, version] = match;
      const key = `${name}@${version}`;
      if (!results.has(key)) {
        results.set(key, {
          name,
          version,
          ecosystem: 'RubyGems',
          purl: `pkg:gem/${encodeURIComponent(name)}@${version}`,
          sourceFile: filePath,
          isDirect: false,
        });
      }
    }

    return Array.from(results.values());
  }
}
