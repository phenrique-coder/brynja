'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { HttpScanGateway } from '../gateways/http-scan.gateway';
import {
  IAuditLogReader,
  IGitHubIntegrationPort,
  IScanCreator,
  IScanReader,
  ITargetAuthorizer,
  IVereditoGateway,
} from '../ports/scan-gateway.port';

const GatewayContext = createContext<IVereditoGateway | null>(null);

export interface GatewayProviderProps {
  children: React.ReactNode;
  gateway?: IVereditoGateway;
}

export function GatewayProvider({ children, gateway }: GatewayProviderProps) {
  const instance = useMemo(
    () => gateway ?? new HttpScanGateway(),
    [gateway],
  );

  return (
    <GatewayContext.Provider value={instance}>
      {children}
    </GatewayContext.Provider>
  );
}

function useGateway(): IVereditoGateway {
  const ctx = useContext(GatewayContext);
  if (!ctx) {
    throw new Error('useGateway precisa estar dentro de GatewayProvider.');
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
