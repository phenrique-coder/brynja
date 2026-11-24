import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GitHubIntegrationModule } from './modules/github-integration/github-integration.module';
import { ScansModule } from './modules/scans/scans.module';
import { PrismaModule } from './shared/prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),
    PrismaModule,
    GitHubIntegrationModule,
    ScansModule,
  ],
})
export class AppModule {}
