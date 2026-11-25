export interface ChangelogSection {
  title: string;
  items: string[];
}

export interface ChangelogRelease {
  version: string;
  date: string;
  sections: ChangelogSection[];
}

/**
 * Pure parser for Keep a Changelog markdown files (`## [X.Y.Z] - YYYY-MM-DD`).
 */
export function parseChangelogMarkdown(markdown: string): ChangelogRelease[] {
  const releases: ChangelogRelease[] = [];
  let currentRelease: ChangelogRelease | null = null;
  let currentSection: ChangelogSection | null = null;

  const lines = markdown.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();

    const releaseMatch = /^##\s+\[([^\]]+)\](?:\s*-\s*(.+))?$/.exec(line);
    if (releaseMatch) {
      currentRelease = {
        version: releaseMatch[1].trim(),
        date: (releaseMatch[2] ?? '').trim(),
        sections: [],
      };
      releases.push(currentRelease);
      currentSection = null;
      continue;
    }

    if (!currentRelease) continue;

    const sectionMatch = /^###\s+(.+)$/.exec(line);
    if (sectionMatch) {
      currentSection = {
        title: sectionMatch[1].trim(),
        items: [],
      };
      currentRelease.sections.push(currentSection);
      continue;
    }

    const bulletMatch = /^[-*]\s+(.+)$/.exec(line);
    if (bulletMatch && currentSection) {
      currentSection.items.push(bulletMatch[1].trim());
    }
  }

  return releases;
}
