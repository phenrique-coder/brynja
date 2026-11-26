'use client';

import { useCallback, useEffect, useState } from 'react';
import { GatewayHttpError } from '@/core/gateways/http-scan.gateway';
import {
  GitHubIntegrationStatus,
  GitHubRepoSummary,
  GrcAssessment,
  ProbeAuditEntry,
  ScanReport,
  ScanSummary,
  TargetAuthorization,
} from '@/core/models/scan.models';
import {
  useAuditLogReader,
  useGitHubIntegration,
  useGrcAssessmentPort,
  useScanReader,
  useSharedSession,
  useTargetAuthorizer,
} from '@/core/providers/gateway-provider';

function isAuthError(err: unknown): boolean {
  return err instanceof GatewayHttpError && err.statusCode === 401;
}

export function useGitHubSession(returnTo = '/') {
  const github = useGitHubIntegration();
  const shared = useSharedSession();

  return {
    status: shared.status,
    loading: shared.loading,
    refresh: shared.refresh,
    connectUrl: github.getGitHubConnectUrl(returnTo),
    disconnect: shared.disconnect,
  };
}

export function useScanList(limit = 25) {
  const reader = useScanReader();
  const session = useSharedSession();
  const [scans, setScans] = useState<ScanSummary[]>([]);
  const [loading, setLoading] = useState(!session.knownUnauthenticated);
  const [authRequired, setAuthRequired] = useState(
    session.knownUnauthenticated,
  );
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (session.loading) return;
    if (session.knownUnauthenticated) {
      setAuthRequired(true);
      setLoading(false);
      return;
    }
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
  }, [reader, limit, session.loading, session.knownUnauthenticated]);

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

  return {
    scans,
    loading: session.loading || loading,
    authRequired: session.knownUnauthenticated || authRequired,
    error,
    refresh,
    removeScan,
  };
}

export function useScanReport(scanId: string) {
  const reader = useScanReader();
  const session = useSharedSession();
  const [report, setReport] = useState<ScanReport | null>(null);
  const [loading, setLoading] = useState(!session.knownUnauthenticated);
  const [authRequired, setAuthRequired] = useState(
    session.knownUnauthenticated,
  );
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (session.loading) return;
    if (session.knownUnauthenticated) {
      setAuthRequired(true);
      setLoading(false);
      return;
    }
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
  }, [reader, scanId, session.loading, session.knownUnauthenticated]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!report) return;
    if (report.status !== 'QUEUED' && report.status !== 'RUNNING') return;

    const timer = setInterval(() => {
      void refresh();
    }, 500);
    return () => clearInterval(timer);
  }, [report, refresh]);

  return {
    report,
    loading: session.loading || loading,
    authRequired: session.knownUnauthenticated || authRequired,
    error,
    refresh,
  };
}

export function useTargetAuthorizations() {
  const authorizer = useTargetAuthorizer();
  const session = useSharedSession();
  const [items, setItems] = useState<TargetAuthorization[]>([]);
  const [loading, setLoading] = useState(!session.knownUnauthenticated);
  const [authRequired, setAuthRequired] = useState(
    session.knownUnauthenticated,
  );
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (session.loading) return;
    if (session.knownUnauthenticated) {
      setAuthRequired(true);
      setLoading(false);
      return;
    }
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
  }, [authorizer, session.loading, session.knownUnauthenticated]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    items,
    loading: session.loading || loading,
    authRequired: session.knownUnauthenticated || authRequired,
    error,
    refresh,
  };
}

export function useAuditLogs(scanId?: string) {
  const reader = useAuditLogReader();
  const session = useSharedSession();
  const [logs, setLogs] = useState<ProbeAuditEntry[]>([]);
  const [loading, setLoading] = useState(!session.knownUnauthenticated);
  const [authRequired, setAuthRequired] = useState(
    session.knownUnauthenticated,
  );
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (session.loading) return;
    if (session.knownUnauthenticated) {
      setAuthRequired(true);
      setLoading(false);
      return;
    }
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
  }, [reader, scanId, session.loading, session.knownUnauthenticated]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    logs,
    loading: session.loading || loading,
    authRequired: session.knownUnauthenticated || authRequired,
    error,
    refresh,
  };
}

export function useGitHubRepositories(returnTo = '/scans/new') {
  const github = useGitHubIntegration();
  const session = useSharedSession();
  const [status, setStatus] = useState<GitHubIntegrationStatus | null>(
    session.status,
  );
  const [repos, setRepos] = useState<GitHubRepoSummary[]>([]);
  const [loading, setLoading] = useState(!session.knownUnauthenticated);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (session.loading) return;
    if (session.knownUnauthenticated) {
      setStatus(session.status);
      setRepos([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const currentStatus =
        session.status ?? (await github.getGitHubStatus());
      setStatus(currentStatus);
      if (currentStatus?.connected) {
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
  }, [github, session.loading, session.knownUnauthenticated, session.status]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    status: session.status ?? status,
    repos,
    loading: session.loading || loading,
    authRequired:
      session.knownUnauthenticated ||
      Boolean(
        (session.status ?? status)?.configured &&
          !(session.status ?? status)?.connected,
      ),
    error,
    refresh,
    connectUrl: github.getGitHubConnectUrl(returnTo),
    disconnect: session.disconnect,
  };
}

export function useGrcAssessments() {
  const port = useGrcAssessmentPort();
  const session = useSharedSession();
  const [assessments, setAssessments] = useState<GrcAssessment[]>([]);
  const [loading, setLoading] = useState(!session.knownUnauthenticated);
  const [authRequired, setAuthRequired] = useState(
    session.knownUnauthenticated,
  );
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (session.loading) return;
    if (session.knownUnauthenticated) {
      setAuthRequired(true);
      setLoading(false);
      return;
    }
    try {
      setError(null);
      setAuthRequired(false);
      const list = await port.listGrcAssessments();
      setAssessments(list);
    } catch (err) {
      if (isAuthError(err)) {
        setAuthRequired(true);
      } else {
        setError(
          err instanceof Error
            ? err.message
            : 'Erro ao carregar avaliações de governança.',
        );
      }
    } finally {
      setLoading(false);
    }
  }, [port, session.loading, session.knownUnauthenticated]);

  const saveAssessment = useCallback(
    async (assessment: GrcAssessment): Promise<GrcAssessment> => {
      const saved = await port.saveGrcAssessment(assessment);
      setAssessments((prev) => {
        const rest = prev.filter((item) => item.id !== saved.id);
        return [saved, ...rest];
      });
      return saved;
    },
    [port],
  );

  const deleteAssessment = useCallback(
    async (id: string) => {
      await port.deleteGrcAssessment(id);
      setAssessments((prev) => prev.filter((item) => item.id !== id));
    },
    [port],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    assessments,
    loading: session.loading || loading,
    authRequired: session.knownUnauthenticated || authRequired,
    error,
    refresh,
    saveAssessment,
    deleteAssessment,
  };
}
