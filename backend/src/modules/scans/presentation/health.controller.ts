import { Controller, Get, Inject } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import {
  AGENT_ADVISOR_PORT,
  IAgentAdvisorPort,
} from '../../ai-agents/domain/ports/agent-advisor.port';

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(AGENT_ADVISOR_PORT)
    private readonly agentAdvisor: IAgentAdvisorPort,
  ) {}

  @Get()
  async check() {
    let database = 'down';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      database = 'up';
    } catch {
      database = 'down';
    }

    return {
      service: 'veredito-sec-api',
      status: database === 'up' ? 'ok' : 'degraded',
      database,
      aiAgentsFeatureEnabled: this.agentAdvisor.isEnabled(),
      timestamp: new Date().toISOString(),
    };
  }
}
