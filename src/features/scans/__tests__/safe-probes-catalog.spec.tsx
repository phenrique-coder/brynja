import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  SAFE_PROBE_IDS,
  SAFE_PROBES_CATALOG,
} from '@/core/catalog/safe-probes.catalog';
import { DICTIONARIES, SUPPORTED_LOCALES } from '@/core/i18n';
import { I18nProvider } from '@/core/providers/i18n-provider';
import { createRegisteredSafeProbes } from '@/server/application/container';
import { SafeProbesCatalogSection } from '../components/SafeProbesCatalogSection';

describe('Safe Probes Catalog Single Source of Truth & /scans/new UI', () => {
  it('stays in exact 1-to-1 parity with every Safe Probe registered in the server container', () => {
    const serverProbes = createRegisteredSafeProbes();
    const serverIds = serverProbes.map((probe) => probe.id);
    const catalogIds = SAFE_PROBES_CATALOG.map((item) => item.id);

    // If a new Safe Probe is added in src/server/application/container.ts,
    // you MUST also register it in src/core/catalog/safe-probes.catalog.ts
    // and document it in pt-BR.ts, en.ts, and es.ts so /scans/new stays updated.
    expect(catalogIds).toEqual(serverIds);
    expect([...SAFE_PROBE_IDS]).toEqual(serverIds);
    expect(new Set(catalogIds).size).toBe(serverIds.length);
  });

  it('provides non-empty name, summary, and checks in every supported locale (pt-BR, en, es)', () => {
    for (const localeMeta of SUPPORTED_LOCALES) {
      const catalogCopy = DICTIONARIES[localeMeta.code].safeProbesCatalog.items;

      for (const probe of SAFE_PROBES_CATALOG) {
        const copy = catalogCopy[probe.id];
        expect(copy, `Missing ${probe.id} in ${localeMeta.code}`).toBeDefined();
        expect(copy.name.trim().length).toBeGreaterThan(3);
        expect(copy.summary.trim().length).toBeGreaterThan(15);
        expect(copy.checks.trim().length).toBeGreaterThan(15);
      }
    }
  });

  it('enforces non-destructive GET/HEAD-only metadata across all catalog entries', () => {
    for (const probe of SAFE_PROBES_CATALOG) {
      expect(probe.methods.length).toBeGreaterThan(0);
      for (const method of probe.methods) {
        expect(['GET', 'HEAD']).toContain(method);
      }
      expect(probe.targets.length).toBeGreaterThan(0);
    }
  });

  it('renders every registered Safe Probe on /scans/new, supports category filtering, and reflects active target state', () => {
    const { container } = render(
      <I18nProvider defaultLocale="pt-BR">
        <SafeProbesCatalogSection selectedTargetOrigin="https://staging.example.com" />
      </I18nProvider>,
    );

    expect(screen.getByText('Tipos de Safe Probes Executados')).toBeTruthy();
    expect(
      screen.getByText('Ativos para https://staging.example.com'),
    ).toBeTruthy();

    const cards = container.querySelectorAll('article[data-probe-id]');
    expect(cards).toHaveLength(SAFE_PROBES_CATALOG.length);

    for (const probe of SAFE_PROBES_CATALOG) {
      const copy = DICTIONARIES['pt-BR'].safeProbesCatalog.items[probe.id];
      expect(screen.getByText(copy.name)).toBeTruthy();
      expect(screen.getByText(probe.id)).toBeTruthy();
    }

    // Filter to Exposure category only (Exposed Artifacts + Exposed Docs & Metrics)
    fireEvent.click(screen.getByRole('tab', { name: /Exposição/i }));
    const filteredCards = container.querySelectorAll('article[data-probe-id]');
    expect(filteredCards).toHaveLength(2);
    expect(screen.getByText('Artefatos Sensíveis Expostos')).toBeTruthy();
    expect(screen.queryByText('Política HSTS em HTTPS')).toBeNull();
  });

  it('switches Safe Probe descriptions cleanly when rendered in English and Spanish', () => {
    const { unmount } = render(
      <I18nProvider defaultLocale="en">
        <SafeProbesCatalogSection />
      </I18nProvider>,
    );

    expect(screen.getByText('Safe Probe Types Executed')).toBeTruthy();
    expect(screen.getByText('HTTP Security Headers & Banners')).toBeTruthy();
    unmount();

    render(
      <I18nProvider defaultLocale="es">
        <SafeProbesCatalogSection />
      </I18nProvider>,
    );

    expect(screen.getByText('Tipos de Safe Probes Ejecutados')).toBeTruthy();
    expect(
      screen.getByText('Cabeceras de Seguridad HTTP y Banners'),
    ).toBeTruthy();
  });
});
