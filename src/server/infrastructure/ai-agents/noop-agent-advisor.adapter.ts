import {
  AgentRemediationPlan,
  IAgentAdvisorPort,
} from '../../domain/ports/server.ports';

export class NoopAgentAdvisorAdapter implements IAgentAdvisorPort {
  readonly enabled = false;

  async adviseOnFindings(): Promise<AgentRemediationPlan | null> {
    return null;
  }
}
