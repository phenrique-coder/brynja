import * as path from 'node:path';
import { Ecosystem, ParsedDependency } from '../../domain/entities/scan.types';
import { IDependencyParser } from '../../domain/ports/server.ports';

export class GoManifestParser implements IDependencyParser {
  readonly ecosystem: Ecosystem = 'Go';

  supports(filePath: string): boolean {
    const base = path.posix.basename(filePath);
    return base === 'go.mod' || base === 'go.sum';
  }

  parse(filePath: string, content: string): ParsedDependency[] {
    const base = path.posix.basename(filePath);
    if (base === 'go.mod') {
      return this.parseGoMod(filePath, content);
    }
    if (base === 'go.sum') {
      return this.parseGoSum(filePath, content);
    }
    return [];
  }

  private parseGoMod(filePath: string, content: string): ParsedDependency[] {
    const results = new Map<string, ParsedDependency>();
    const lines = content.split(/\r?\n/);
    let inRequireBlock = false;

    for (const rawLine of lines) {
      const noComment = rawLine.split('//')[0].trim();
      const isIndirectComment = /\/\/\s*indirect\b/i.test(rawLine);
      if (!noComment) continue;

      if (/^require\s*\($/.test(noComment)) {
        inRequireBlock = true;
        continue;
      }
      if (inRequireBlock && noComment === ')') {
        inRequireBlock = false;
        continue;
      }

      let spec = noComment;
      if (!inRequireBlock) {
        if (!noComment.startsWith('require ')) continue;
        spec = noComment.slice('require '.length).trim();
      }

      const match = spec.match(/^([^\s]+)\s+(v?\d+\.\d+\.\d+[^\s]*)/);
      if (!match) continue;

      const name = match[1];
      const version = this.normalizeGoVersion(match[2]);
      const key = `${name}@${version}`;
      if (!results.has(key)) {
        results.set(key, {
          name,
          version,
          ecosystem: 'Go',
          purl: `pkg:golang/${name}@${version}`,
          sourceFile: filePath,
          isDirect: !isIndirectComment,
        });
      }
    }

    return Array.from(results.values());
  }

  private parseGoSum(filePath: string, content: string): ParsedDependency[] {
    const results = new Map<string, ParsedDependency>();
    const lines = content.split(/\r?\n/);

    for (const rawLine of lines) {
      const trimmed = rawLine.trim();
      if (!trimmed) continue;
      const parts = trimmed.split(/\s+/);
      if (parts.length < 3) continue;

      const name = parts[0];
      const rawVersion = parts[1].replace(/\/go\.mod$/, '');
      if (!/^v?\d+\.\d+\.\d+/.test(rawVersion)) continue;

      const version = this.normalizeGoVersion(rawVersion);
      const key = `${name}@${version}`;
      if (!results.has(key)) {
        results.set(key, {
          name,
          version,
          ecosystem: 'Go',
          purl: `pkg:golang/${name}@${version}`,
          sourceFile: filePath,
          isDirect: false,
        });
      }
    }

    return Array.from(results.values());
  }

  private normalizeGoVersion(raw: string): string {
    const clean = raw.replace(/\+incompatible$/, '').trim();
    return clean.startsWith('v') ? clean : `v${clean}`;
  }
}
