'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { HttpScanGateway } from '../gateways/http-scan.gateway';
import {
  AgentRemediationPlan,
  AiModelOption,
  ByokAiConfig,
  GitHubIntegrationStatus,
  GrcAssessment,
  ScanSummary,
} from '../models/scan.models';
import {
  IAiAdvisorGatewayPort,
  IAuditLogReader,
  IBrynjaGateway,
  IExternalReportImporterPort,
  IGitHubIntegrationPort,
  IGrcAssessmentPort,
  IScanCreator,
  IScanReader,
  ITargetAuthorizer,
} from '../ports/scan-gateway.port';

export interface SharedSessionState {
  status: GitHubIntegrationStatus | null;
  loading: boolean;
  knownUnauthenticated: boolean;
  refresh: () => Promise<GitHubIntegrationStatus | null>;
  disconnect: () => Promise<void>;
}

const GatewayContext = createContext<IBrynjaGateway | null>(null);
const SessionContext = createContext<SharedSessionState | null>(null);

export interface GatewayProviderProps {
  children: React.ReactNode;
  gateway?: IBrynjaGateway;
}

export function GatewayProvider({ children, gateway }: GatewayProviderProps) {
  const isCustomGateway = Boolean(gateway);
  const instance = useMemo(
    () => gateway ?? new HttpScanGateway(),
    [gateway],
  );

  const [status, setStatus] = useState<GitHubIntegrationStatus | null>(null);
  const [loading, setLoading] = useState(!isCustomGateway);

  const refresh = useCallback(async (): Promise<GitHubIntegrationStatus | null> => {
    try {
      setLoading(true);
      const data = await instance.getGitHubStatus();
      const resolved = data ?? null;
      setStatus(resolved);
      return resolved;
    } catch {
      setStatus(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [instance]);

  const disconnect = useCallback(async () => {
    await instance.disconnectGitHub();
    setStatus((prev) =>
      prev
        ? {
            ...prev,
            connected: false,
            githubUserId: null,
            login: null,
            name: null,
            avatarUrl: null,
            profileUrl: null,
            sessionExpiresAt: null,
          }
        : null,
    );
    await refresh();
  }, [instance, refresh]);

  useEffect(() => {
    if (isCustomGateway) return;
    void refresh();
  }, [isCustomGateway, refresh]);

  const knownUnauthenticated = Boolean(
    status && status.configured && !status.connected,
  );

  const sessionValue = useMemo<SharedSessionState>(
    () => ({
      status,
      loading,
      knownUnauthenticated,
      refresh,
      disconnect,
    }),
    [status, loading, knownUnauthenticated, refresh, disconnect],
  );

  return (
    <GatewayContext.Provider value={instance}>
      <SessionContext.Provider value={sessionValue}>
        {children}
      </SessionContext.Provider>
    </GatewayContext.Provider>
  );
}

function useGateway(): IBrynjaGateway {
  const ctx = useContext(GatewayContext);
  if (!ctx) {
    throw new Error('useGateway precisa estar dentro de GatewayProvider.');
  }
  return ctx;
}

export function useSharedSession(): SharedSessionState {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSharedSession precisa estar dentro de GatewayProvider.');
  }
  return ctx;
}

// Segregated hooks respecting Interface Segregation Principle (ISP)
export function useScanReader(): IScanReader {
  return useGateway();
}

export function useScanCreator(): IScanCreator {
  return useGateway();
}

export function useTargetAuthorizer(): ITargetAuthorizer {
  return useGateway();
}

export function useAuditLogReader(): IAuditLogReader {
  return useGateway();
}

export function useGitHubIntegration(): IGitHubIntegrationPort {
  return useGateway();
}

export function useGrcAssessmentPort(): IGrcAssessmentPort {
  const gateway = useGateway();
  return useMemo<IGrcAssessmentPort>(
    () => ({
      listGrcAssessments: () =>
        gateway.listGrcAssessments
          ? gateway.listGrcAssessments()
          : Promise.resolve([] as GrcAssessment[]),
      getGrcAssessment: (id) =>
        gateway.getGrcAssessment
          ? gateway.getGrcAssessment(id)
          : Promise.resolve(null),
      saveGrcAssessment: (assessment) =>
        gateway.saveGrcAssessment
          ? gateway.saveGrcAssessment(assessment)
          : Promise.resolve(assessment),
      deleteGrcAssessment: (id) =>
        gateway.deleteGrcAssessment
          ? gateway.deleteGrcAssessment(id)
          : Promise.resolve(),
    }),
    [gateway],
  );
}

export function useAiAdvisorPort(): IAiAdvisorGatewayPort {
  const gateway = useGateway();
  return useMemo<IAiAdvisorGatewayPort>(
    () => ({
      requestAiAdvice: (scanId: string, byok?: ByokAiConfig | null) =>
        gateway.requestAiAdvice
          ? gateway.requestAiAdvice(scanId, byok)
          : Promise.resolve<AgentRemediationPlan>({
              summary: 'IA indisponível neste gateway.',
              prioritizedSteps: [],
              generatedBy: 'noop',
            }),
      listAiModels: (byok: ByokAiConfig) =>
        gateway.listAiModels
          ? gateway.listAiModels(byok)
          : Promise.resolve<AiModelOption[]>([]),
    }),
    [gateway],
  );
}

export function useExternalReportImporterPort(): IExternalReportImporterPort {
  const gateway = useGateway();
  return useMemo<IExternalReportImporterPort>(
    () => ({
      importExternalReport: (rawJsonText: string, sourceLabel?: string) => {
        if (!gateway.importExternalReport) {
          return Promise.reject(
            new Error('Importação externa não suportada neste gateway.'),
          ) as Promise<ScanSummary>;
        }
        return gateway.importExternalReport(rawJsonText, sourceLabel);
      },
    }),
    [gateway],
  );
}
