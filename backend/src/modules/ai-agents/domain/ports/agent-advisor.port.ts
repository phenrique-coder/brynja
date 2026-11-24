import { NormalizedAdvisory, ParsedDependency } from '../../../scans/domain/entities/scan.types';

export const AGENT_ADVISOR_PORT = Symbol('AGENT_ADVISOR_PORT');

export interface AgentTriageSuggestion {
  advisoryId: string;
  reachabilityHypothesis: string;
  remediationSteps: string[];
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface IAgentAdvisorPort {
  isEnabled(): boolean;
  analyzeFindings(
    dependencies: ParsedDependency[],
    advisories: NormalizedAdvisory[],
  ): Promise<AgentTriageSuggestion[]>;
}
