import * as path from 'node:path';
import { Ecosystem, ParsedDependency } from '../../domain/entities/scan.types';
import { IDependencyParser } from '../../domain/ports/server.ports';

export class JavaManifestParser implements IDependencyParser {
  readonly ecosystem: Ecosystem = 'Maven';

  supports(filePath: string): boolean {
    const base = path.posix.basename(filePath);
    return base === 'pom.xml' || base === 'gradle.lockfile';
  }

  parse(filePath: string, content: string): ParsedDependency[] {
    const base = path.posix.basename(filePath);
    if (base === 'pom.xml') {
      return this.parsePomXml(filePath, content);
    }
    if (base === 'gradle.lockfile') {
      return this.parseGradleLockfile(filePath, content);
    }
    return [];
  }

  private parsePomXml(filePath: string, content: string): ParsedDependency[] {
    const properties = new Map<string, string>();
    const propsBlockMatch = content.match(/<properties>([\s\S]*?)<\/properties>/i);
    if (propsBlockMatch) {
      const propRegex = /<([A-Za-z0-9_.-]+)>\s*([^<\s][^<]*)\s*<\/\1>/g;
      let propMatch: RegExpExecArray | null;
      while ((propMatch = propRegex.exec(propsBlockMatch[1])) !== null) {
        properties.set(propMatch[1].trim(), propMatch[2].trim());
      }
    }

    const results = new Map<string, ParsedDependency>();
    const depRegex = /<dependency\b[^>]*>([\s\S]*?)<\/dependency>/gi;
    let depMatch: RegExpExecArray | null;

    while ((depMatch = depRegex.exec(content)) !== null) {
      const block = depMatch[1];
      const group = block.match(/<groupId>\s*([^<\s]+)\s*<\/groupId>/i)?.[1];
      const artifact = block.match(/<artifactId>\s*([^<\s]+)\s*<\/artifactId>/i)?.[1];
      let version = block.match(/<version>\s*([^<\s]+)\s*<\/version>/i)?.[1];
      if (!group || !artifact || !version) continue;

      const propRef = version.match(/^\$\{([^}]+)\}$/);
      if (propRef) {
        version = properties.get(propRef[1].trim());
      }
      if (!version || version.includes('${') || !/\d/.test(version)) continue;

      const name = `${group}:${artifact}`;
      const key = `${name}@${version}`;
      if (!results.has(key)) {
        results.set(key, {
          name,
          version,
          ecosystem: 'Maven',
          purl: `pkg:maven/${encodeURIComponent(group)}/${encodeURIComponent(artifact)}@${version}`,
          sourceFile: filePath,
          isDirect: true,
        });
      }
    }

    return Array.from(results.values());
  }

  private parseGradleLockfile(
    filePath: string,
    content: string,
  ): ParsedDependency[] {
    const results = new Map<string, ParsedDependency>();
    const lines = content.split(/\r?\n/);

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#') || line.startsWith('empty=')) continue;

      const coord = line.split('=')[0].trim();
      const parts = coord.split(':');
      if (parts.length < 3) continue;

      const [group, artifact, version] = parts;
      if (!group || !artifact || !version) continue;
      const name = `${group}:${artifact}`;
      const key = `${name}@${version}`;
      if (!results.has(key)) {
        results.set(key, {
          name,
          version,
          ecosystem: 'Maven',
          purl: `pkg:maven/${encodeURIComponent(group)}/${encodeURIComponent(artifact)}@${version}`,
          sourceFile: filePath,
          isDirect: false,
        });
      }
    }

    return Array.from(results.values());
  }
}
