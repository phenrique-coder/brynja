import { Module } from '@nestjs/common';
import { AGENT_ADVISOR_PORT } from './domain/ports/agent-advisor.port';
import { NoopAgentAdvisorAdapter } from './infrastructure/noop-agent-advisor.adapter';

@Module({
  providers: [
    NoopAgentAdvisorAdapter,
    {
      provide: AGENT_ADVISOR_PORT,
      useExisting: NoopAgentAdvisorAdapter,
    },
  ],
  exports: [AGENT_ADVISOR_PORT],
})
export class AiAgentsModule {}
