import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import React from 'react';
import { parseChangelogMarkdown } from '@/core/changelog/changelog.parser';
import { ChangelogView } from '@/features/scans/components/ChangelogView';
import packageJson from '../../../package.json';

function loadMarkdownReleases(segments: string[]) {
  try {
    const raw = readFileSync(join(process.cwd(), ...segments), 'utf8');
    return parseChangelogMarkdown(raw);
  } catch {
    return [];
  }
}

export const metadata = {
  title: 'Changelog — Brynja',
  description:
    'Histórico de versões, novidades, melhorias e correções de segurança do Brynja.',
};

export default function ChangelogPage() {
  const ptReleases = loadMarkdownReleases(['docs', 'pt-BR', 'CHANGELOG.md']);
  const enReleases = loadMarkdownReleases(['CHANGELOG.md']);

  return (
    <ChangelogView
      currentVersion={packageJson.version}
      ptReleases={ptReleases}
      enReleases={enReleases}
    />
  );
}
