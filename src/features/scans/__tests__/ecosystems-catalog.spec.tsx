import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  CROSS_STACK_LAYERS,
  ECOSYSTEMS_CATALOG,
} from '@/core/catalog/ecosystems.catalog';
import { DICTIONARIES, SUPPORTED_LOCALES } from '@/core/i18n';
import { SUPPORTED_ECOSYSTEMS } from '@/core/models/scan.models';
import { I18nProvider } from '@/core/providers/i18n-provider';
import { createRegisteredDependencyParsers } from '@/server/application/container';
import { LightweightSastAnalyzer } from '@/server/infrastructure/static-analysis/lightweight-sast.analyzer';
import {
  SupportedEcosystemsBar,
  SupportedEcosystemsSection,
} from '../components/SupportedEcosystemsSection';

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe('Supported Ecosystems Catalog Parity & UI', () => {
  it('stays in exact 1-to-1 parity with every SCA parser registered in the server container', () => {
    const parsers = createRegisteredDependencyParsers();
    const serverEcosystems = parsers.map((parser) => parser.ecosystem);
    const catalogIds = ECOSYSTEMS_CATALOG.map((item) => item.id);

    expect(catalogIds).toEqual([...SUPPORTED_ECOSYSTEMS]);
    expect(serverEcosystems).toEqual([...SUPPORTED_ECOSYSTEMS]);
    expect(new Set(catalogIds).size).toBe(serverEcosystems.length);

    const sastAnalyzer = new LightweightSastAnalyzer();

    for (const item of ECOSYSTEMS_CATALOG) {
      const parser = parsers.find((p) => p.ecosystem === item.id);
      expect(parser, `Missing server parser for ${item.id}`).toBeDefined();

      expect(item.manifests.length).toBeGreaterThan(0);
      for (const manifest of item.manifests) {
        const samplePath = manifest.replace('*', 'App');
        expect(
          parser!.supports(samplePath),
          `Parser for ${item.id} did not support advertised manifest "${manifest}"`,
        ).toBe(true);
      }

      for (const ext of item.sastLanguages) {
        expect(
          sastAnalyzer.supports(`src/sample${ext}`),
          `LightweightSastAnalyzer did not support advertised extension "${ext}"`,
        ).toBe(true);
      }
    }
  });

  it('provides non-empty localized copy across all ecosystems and cross-stack layers in pt-BR, en, and es', () => {
    for (const localeMeta of SUPPORTED_LOCALES) {
      const cat = DICTIONARIES[localeMeta.code].ecosystemsCatalog;

      for (const eco of ECOSYSTEMS_CATALOG) {
        const copy = cat.items[eco.id];
        expect(copy, `Missing ${eco.id} copy in ${localeMeta.code}`).toBeDefined();
        expect(copy.language.trim().length).toBeGreaterThan(1);
        expect(copy.description.trim().length).toBeGreaterThan(20);
      }

      for (const layer of CROSS_STACK_LAYERS) {
        const layerCopy = cat.crossStack[layer.id];
        expect(
          layerCopy,
          `Missing cross-stack ${layer.id} copy in ${localeMeta.code}`,
        ).toBeDefined();
        expect(layerCopy.title.trim().length).toBeGreaterThan(3);
        expect(layerCopy.summary.trim().length).toBeGreaterThan(20);
      }
    }
  });

  it('renders all 8 ecosystems and cross-stack layers on /scans/new and filters by analysis capability', () => {
    const { container } = render(
      <I18nProvider defaultLocale="pt-BR">
        <SupportedEcosystemsSection />
      </I18nProvider>,
    );

    expect(
      screen.getByText('Ecossistemas, Manifestos & Linguagens Suportadas'),
    ).toBeTruthy();

    expect(container.querySelectorAll('article[data-ecosystem]')).toHaveLength(
      ECOSYSTEMS_CATALOG.length,
    );
    expect(container.querySelectorAll('[data-cross-stack]')).toHaveLength(
      CROSS_STACK_LAYERS.length,
    );

    for (const eco of ECOSYSTEMS_CATALOG) {
      expect(screen.getByText(eco.id)).toBeTruthy();
      expect(
        screen.getByText(DICTIONARIES['pt-BR'].ecosystemsCatalog.items[eco.id].language),
      ).toBeTruthy();
    }

    fireEvent.click(screen.getByRole('tab', { name: /SAST Nativo/i }));
    const nativeCards = container.querySelectorAll('article[data-ecosystem]');
    expect(nativeCards).toHaveLength(2);
    expect(screen.getByText('npm')).toBeTruthy();
    expect(screen.getByText('PyPI')).toBeTruthy();
    expect(screen.queryByText('crates.io')).toBeNull();

    fireEvent.click(screen.getByRole('tab', { name: /Importação SARIF/i }));
    expect(container.querySelectorAll('article[data-ecosystem]')).toHaveLength(6);
    expect(screen.getByText('crates.io')).toBeTruthy();
    expect(screen.queryByText('PyPI')).toBeNull();
  });

  it('switches ecosystem catalog copy across English and Spanish and renders compact dashboard bar', () => {
    const { unmount } = render(
      <I18nProvider defaultLocale="en">
        <SupportedEcosystemsSection />
      </I18nProvider>,
    );

    expect(
      screen.getByText('Supported Ecosystems, Manifests & Languages'),
    ).toBeTruthy();
    unmount();

    const { unmount: unmountEs } = render(
      <I18nProvider defaultLocale="es">
        <SupportedEcosystemsSection />
      </I18nProvider>,
    );

    expect(
      screen.getByText('Ecosistemas, Manifiestos y Lenguajes Soportados'),
    ).toBeTruthy();
    unmountEs();

    render(
      <I18nProvider defaultLocale="pt-BR">
        <SupportedEcosystemsBar />
      </I18nProvider>,
    );

    expect(screen.getByText('Ecossistemas suportados')).toBeTruthy();
    for (const eco of ECOSYSTEMS_CATALOG) {
      expect(screen.getByText(eco.id)).toBeTruthy();
    }
    const matrixLink = screen.getByRole('link', { name: /Ver matriz completa/i });
    expect(matrixLink.getAttribute('href')).toBe('/scans/new#ecosystems-catalog');
  });
});
