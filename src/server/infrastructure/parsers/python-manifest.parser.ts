import * as path from 'node:path';
import { Ecosystem, ParsedDependency } from '../../domain/entities/scan.types';
import { IDependencyParser } from '../../domain/ports/server.ports';

export class PythonManifestParser implements IDependencyParser {
  readonly ecosystem: Ecosystem = 'PyPI';

  supports(filePath: string): boolean {
    const base = path.posix.basename(filePath);
    return base === 'requirements.txt' || base === 'pyproject.toml';
  }

  parse(filePath: string, content: string): ParsedDependency[] {
    const base = path.posix.basename(filePath);
    if (base === 'requirements.txt') {
      return this.parseRequirementsTxt(filePath, content);
    }
    if (base === 'pyproject.toml') {
      return this.parsePyprojectToml(filePath, content);
    }
    return [];
  }

  private parseRequirementsTxt(
    filePath: string,
    content: string,
  ): ParsedDependency[] {
    const deps: ParsedDependency[] = [];
    const lines = content.split(/\r?\n/);

    for (const rawLine of lines) {
      const line = rawLine.split('#')[0].trim();
      if (!line || line.startsWith('-')) continue;

      const parsed = this.parsePythonSpec(line);
      if (!parsed) continue;
      deps.push({
        name: parsed.name,
        version: parsed.version,
        ecosystem: 'PyPI',
        purl: `pkg:pypi/${parsed.name.toLowerCase()}@${parsed.version}`,
        sourceFile: filePath,
        isDirect: true,
      });
    }

    return deps;
  }

  private parsePyprojectToml(
    filePath: string,
    content: string,
  ): ParsedDependency[] {
    const deps: ParsedDependency[] = [];

    const arrayMatch = content.match(/dependencies\s*=\s*\[([\s\S]*?)\]/m);
    if (arrayMatch) {
      const items = arrayMatch[1].match(/["']([^"']+)["']/g) ?? [];
      for (const quoted of items) {
        const spec = quoted.slice(1, -1);
        const parsed = this.parsePythonSpec(spec);
        if (!parsed) continue;
        deps.push({
          name: parsed.name,
          version: parsed.version,
          ecosystem: 'PyPI',
          purl: `pkg:pypi/${parsed.name.toLowerCase()}@${parsed.version}`,
          sourceFile: filePath,
          isDirect: true,
        });
      }
    }

    const lines = content.split(/\r?\n/);
    let inPoetryDeps = false;
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('[')) {
        inPoetryDeps = trimmed === '[tool.poetry.dependencies]';
        continue;
      }
      if (!inPoetryDeps || !trimmed || trimmed.startsWith('#')) continue;

      const kv = trimmed.match(/^([A-Za-z0-9_.-]+)\s*=\s*["']([^"']+)["']/);
      if (!kv) continue;
      const [, name, rawVer] = kv;
      if (name.toLowerCase() === 'python') continue;
      const verMatch = rawVer.match(/(\d+\.\d+(?:\.\d+)?)/);
      if (!verMatch) continue;
      deps.push({
        name,
        version: verMatch[1],
        ecosystem: 'PyPI',
        purl: `pkg:pypi/${name.toLowerCase()}@${verMatch[1]}`,
        sourceFile: filePath,
        isDirect: true,
      });
    }

    return deps;
  }

  private parsePythonSpec(
    spec: string,
  ): { name: string; version: string } | null {
    const noMarkers = spec.split(';')[0].trim();
    const match = noMarkers.match(
      /^([A-Za-z0-9_.-]+)(?:\[[^\]]+\])?\s*(?:===|==|~=|>=|<=)\s*([0-9]+(?:\.[0-9]+)+(?:[a-zA-Z0-9.-]*)?)/,
    );
    if (!match) return null;
    return {
      name: match[1],
      version: match[2],
    };
  }
}
