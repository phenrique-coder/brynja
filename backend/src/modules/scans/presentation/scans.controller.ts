import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EphemeralGitHubSession } from '../../github-integration/domain/ports/github-integration.port';
import {
  CurrentSession,
  SessionAuthGuard,
} from '../../github-integration/presentation/session-auth.guard';
import {
  DeleteScanUseCase,
  GetScanReportUseCase,
  ListAuditLogsUseCase,
  ListScansUseCase,
} from '../application/query-scans.use-case';
import { TriggerScanUseCase } from '../application/trigger-scan.use-case';
import {
  CreateScanDto,
  CreateScanSchema,
  ZodValidationPipe,
} from './dto/scan.dto';

@Controller('scans')
@UseGuards(SessionAuthGuard)
export class ScansController {
  constructor(
    private readonly triggerScan: TriggerScanUseCase,
    private readonly listScans: ListScansUseCase,
    private readonly getScanReport: GetScanReportUseCase,
    private readonly listAuditLogs: ListAuditLogsUseCase,
    private readonly deleteScan: DeleteScanUseCase,
  ) {}

  @Post()
  async create(
    @Body(new ZodValidationPipe(CreateScanSchema)) dto: CreateScanDto,
    @CurrentSession() session: EphemeralGitHubSession,
  ) {
    return this.triggerScan.execute({
      ...dto,
      ownerGithubUserId: session.githubUserId,
      ownerLogin: session.login,
      githubAccessToken: session.accessToken,
    });
  }

  @Get()
  async list(
    @CurrentSession() session: EphemeralGitHubSession,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? Math.min(100, Math.max(1, Number(limit))) : 25;
    return this.listScans.execute(
      session.githubUserId,
      Number.isFinite(parsedLimit) ? parsedLimit : 25,
    );
  }

  @Get('audit-logs')
  async auditLogs(
    @CurrentSession() session: EphemeralGitHubSession,
    @Query('scanId') scanId?: string,
  ) {
    return this.listAuditLogs.execute(session.githubUserId, scanId);
  }

  @Get(':id')
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentSession() session: EphemeralGitHubSession,
  ) {
    return this.getScanReport.execute(id, session.githubUserId);
  }

  @Delete(':id')
  async remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentSession() session: EphemeralGitHubSession,
  ) {
    return this.deleteScan.execute(id, session.githubUserId);
  }
}
