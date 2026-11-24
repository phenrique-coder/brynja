'use client';

import { useCallback, useEffect, useState } from 'react';
import { GatewayHttpError } from '@/core/gateways/http-scan.gateway';
import {
  GitHubIntegrationStatus,
  GitHubRepoSummary,
  ProbeAuditEntry,
  ScanReport,
  ScanSummary,
  TargetAuthorization,
} from '@/core/models/scan.models';
import {
  useAuditLogReader,
  useGitHubIntegration,
  useScanReader,
  useTargetAuthorizer,
} from '@/core/providers/gateway-provider';

function isAuthError(err: unknown): boolean {
  return err instanceof GatewayHttpError && err.statusCode === 401;
}

export function useGitHubSession(returnTo = '/') {
  const github = useGitHubIntegration();
  const [status, setStatus] = useState<GitHubIntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await github.getGitHubStatus();
      setStatus(data);
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, [github]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    status,
    loading,
    refresh,
    connectUrl: github.getGitHubConnectUrl(returnTo),
    disconnect: async () => {
      await github.disconnectGitHub();
      await refresh();
    },
  };
}

export function useScanList(limit = 25) {
  const reader = useScanReader();
  const [scans, setScans] = useState<ScanSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      setAuthRequired(false);
      const data = await reader.listScans(limit);
      setScans(data);
    } catch (err) {
      if (isAuthError(err)) {
        setAuthRequired(true);
      } else {
        setError(err instanceof Error ? err.message : 'Erro ao carregar scans.');
      }
    } finally {
      setLoading(false);
    }
  }, [reader, limit]);

  const removeScan = useCallback(
    async (scanId: string) => {
      try {
        setError(null);
        await reader.deleteScan(scanId);
        setScans((prev) => prev.filter((item) => item.id !== scanId));
      } catch (err) {
        if (isAuthError(err)) {
          setAuthRequired(true);
        } else {
          setError(
            err instanceof Error
              ? err.message
              : 'Erro ao remover varredura do histórico.',
          );
        }
      }
    },
    [reader],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { scans, loading, authRequired, error, refresh, removeScan };
}

export function useScanReport(scanId: string) {
  const reader = useScanReader();
  const [report, setReport] = useState<ScanReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      setAuthRequired(false);
      const data = await reader.getScanReport(scanId);
      setReport(data);
    } catch (err) {
      if (isAuthError(err)) {
        setAuthRequired(true);
      } else {
        setError(
          err instanceof Error ? err.message : 'Erro ao carregar relatório.',
        );
      }
    } finally {
      setLoading(false);
    }
  }, [reader, scanId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!report) return;
    if (report.status !== 'QUEUED' && report.status !== 'RUNNING') return;

    const timer = setInterval(() => {
      void refresh();
    }, 1500);
    return () => clearInterval(timer);
  }, [report, refresh]);

  return { report, loading, authRequired, error, refresh };
}

export function useTargetAuthorizations() {
  const authorizer = useTargetAuthorizer();
  const [items, setItems] = useState<TargetAuthorization[]>([]);
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      setAuthRequired(false);
      const list = await authorizer.listAuthorizations();
      setItems(list);
    } catch (err) {
      if (isAuthError(err)) {
        setAuthRequired(true);
      } else {
        setError(
          err instanceof Error ? err.message : 'Erro ao carregar autorizações.',
        );
      }
    } finally {
      setLoading(false);
    }
  }, [authorizer]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { items, loading, authRequired, error, refresh };
}

export function useAuditLogs(scanId?: string) {
  const reader = useAuditLogReader();
  const [logs, setLogs] = useState<ProbeAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      setAuthRequired(false);
      const data = await reader.listAuditLogs(scanId);
      setLogs(data);
    } catch (err) {
      if (isAuthError(err)) {
        setAuthRequired(true);
      } else {
        setError(
          err instanceof Error
            ? err.message
            : 'Erro ao carregar trilha de auditoria.',
        );
      }
    } finally {
      setLoading(false);
    }
  }, [reader, scanId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { logs, loading, authRequired, error, refresh };
}

export function useGitHubRepositories(returnTo = '/scans/new') {
  const github = useGitHubIntegration();
  const [status, setStatus] = useState<GitHubIntegrationStatus | null>(null);
  const [repos, setRepos] = useState<GitHubRepoSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const currentStatus = await github.getGitHubStatus();
      setStatus(currentStatus);
      if (currentStatus.connected) {
        const repoList = await github.listGitHubRepos();
        setRepos(repoList);
      } else {
        setRepos([]);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erro ao consultar integração GitHub.',
      );
    } finally {
      setLoading(false);
    }
  }, [github]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    status,
    repos,
    loading,
    error,
    refresh,
    connectUrl: github.getGitHubConnectUrl(returnTo),
    disconnect: async () => {
      await github.disconnectGitHub();
      await refresh();
    },
  };
}
