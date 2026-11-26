import * as path from 'node:path';
import { Ecosystem, ParsedDependency } from '../../domain/entities/scan.types';
import { IDependencyParser } from '../../domain/ports/server.ports';

export class RustManifestParser implements IDependencyParser {
  readonly ecosystem: Ecosystem = 'crates.io';

  supports(filePath: string): boolean {
    const base = path.posix.basename(filePath);
    return base === 'Cargo.toml' || base === 'Cargo.lock';
  }

  parse(filePath: string, content: string): ParsedDependency[] {
    const base = path.posix.basename(filePath);
    if (base === 'Cargo.lock') {
      return this.parseCargoLock(filePath, content);
    }
    if (base === 'Cargo.toml') {
      return this.parseCargoToml(filePath, content);
    }
    return [];
  }

  private parseCargoToml(
    filePath: string,
    content: string,
  ): ParsedDependency[] {
    const results = new Map<string, ParsedDependency>();
    const lines = content.split(/\r?\n/);
    let inDepsSection = false;

    for (const rawLine of lines) {
      const trimmed = rawLine.split('#')[0].trim();
      if (!trimmed) continue;

      if (trimmed.startsWith('[')) {
        inDepsSection =
          trimmed === '[dependencies]' ||
          trimmed === '[dev-dependencies]' ||
          trimmed === '[build-dependencies]' ||
          /^\[(?:workspace\.)?dependencies\]/.test(trimmed);
        continue;
      }

      if (!inDepsSection) continue;

      const simpleMatch = trimmed.match(
        /^([A-Za-z0-9_-]+)\s*=\s*["']([^"']+)["']/,
      );
      const tableMatch = trimmed.match(
        /^([A-Za-z0-9_-]+)\s*=\s*\{[^}]*version\s*=\s*["']([^"']+)["']/,
      );
      const match = simpleMatch ?? tableMatch;
      if (!match) continue;

      const name = match[1];
      const verMatch = match[2].match(/(\d+\.\d+(?:\.\d+)?(?:-[0-9A-Za-z.-]+)?)/);
      if (!verMatch) continue;
      const version = verMatch[1];

      const key = `${name}@${version}`;
      if (!results.has(key)) {
        results.set(key, {
          name,
          version,
          ecosystem: 'crates.io',
          purl: `pkg:cargo/${name}@${version}`,
          sourceFile: filePath,
          isDirect: true,
        });
      }
    }

    return Array.from(results.values());
  }

  private parseCargoLock(
    filePath: string,
    content: string,
  ): ParsedDependency[] {
    const results = new Map<string, ParsedDependency>();
    const blocks = content.split(/\[\[package\]\]/);

    for (const block of blocks.slice(1)) {
      const nameMatch = block.match(/^\s*name\s*=\s*["']([^"']+)["']/m);
      const verMatch = block.match(/^\s*version\s*=\s*["']([^"']+)["']/m);
      if (!nameMatch || !verMatch) continue;

      const name = nameMatch[1];
      const version = verMatch[1];
      const key = `${name}@${version}`;
      if (!results.has(key)) {
        results.set(key, {
          name,
          version,
          ecosystem: 'crates.io',
          purl: `pkg:cargo/${name}@${version}`,
          sourceFile: filePath,
          isDirect: false,
        });
      }
    }

    return Array.from(results.values());
  }
}
