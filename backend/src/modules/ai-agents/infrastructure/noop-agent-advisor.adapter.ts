import { Injectable } from '@nestjs/common';
import {
  AgentTriageSuggestion,
  IAgentAdvisorPort,
} from '../domain/ports/agent-advisor.port';
import {
  NormalizedAdvisory,
  ParsedDependency,
} from '../../scans/domain/entities/scan.types';

@Injectable()
export class NoopAgentAdvisorAdapter implements IAgentAdvisorPort {
  isEnabled(): boolean {
    return false;
  }

  async analyzeFindings(
    _dependencies: ParsedDependency[],
    _advisories: NormalizedAdvisory[],
  ): Promise<AgentTriageSuggestion[]> {
    // Extension point reserved for future AI Agents triage feature.
    return [];
  }
}
