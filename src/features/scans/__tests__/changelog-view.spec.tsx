// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/core/providers/i18n-provider';
import { ChangelogRelease } from '@/core/changelog/changelog.parser';
import { ChangelogView } from '../components/ChangelogView';

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const SAMPLE_RELEASES: ChangelogRelease[] = [
  {
    version: '1.7.1',
    date: '2026-11-25',
    sections: [
      {
        title: 'Corrigido',
        items: ['Correção no card Escudo Íntegro no tema dark.'],
      },
    ],
  },
  {
    version: '1.7.0',
    date: '2026-11-25',
    sections: [
      {
        title: 'Adicionado',
        items: ['Menu dropdown Exportar Relatório no canto direito.'],
      },
    ],
  },
  {
    version: '1.6.1',
    date: '2026-11-25',
    sections: [
      {
        title: 'Corrigido',
        items: ['Aprimorado o guia de proxy reverso em /authorizations.'],
      },
    ],
  },
];

describe('ChangelogView accordion', () => {
  it('expands only the latest release by default and toggles older releases on click', () => {
    render(
      <I18nProvider>
        <ChangelogView
          currentVersion="1.7.1"
          ptReleases={SAMPLE_RELEASES}
          enReleases={SAMPLE_RELEASES}
        />
      </I18nProvider>,
    );

    const latestBtn = screen.getByRole('button', { name: /v1\.7\.1/i });
    const prevBtn = screen.getByRole('button', { name: /v1\.7\.0/i });
    const olderBtn = screen.getByRole('button', { name: /v1\.6\.1/i });

    expect(latestBtn).toHaveAttribute('aria-expanded', 'true');
    expect(prevBtn).toHaveAttribute('aria-expanded', 'false');
    expect(olderBtn).toHaveAttribute('aria-expanded', 'false');

    expect(
      screen.getByText(/Correção no card Escudo Íntegro no tema dark\./i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Menu dropdown Exportar Relatório no canto direito\./i),
    ).not.toBeInTheDocument();

    fireEvent.click(prevBtn);
    expect(prevBtn).toHaveAttribute('aria-expanded', 'true');
    expect(
      screen.getByText(/Menu dropdown Exportar Relatório no canto direito\./i),
    ).toBeInTheDocument();

    fireEvent.click(latestBtn);
    expect(latestBtn).toHaveAttribute('aria-expanded', 'false');
    expect(
      screen.queryByText(/Correção no card Escudo Íntegro no tema dark\./i),
    ).not.toBeInTheDocument();
  });
});
