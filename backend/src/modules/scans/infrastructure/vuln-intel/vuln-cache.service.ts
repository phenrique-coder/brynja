import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../shared/prisma/prisma.service';

@Injectable()
export class PrismaVulnerabilityCacheService {
  constructor(private readonly prisma: PrismaService) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const entry = await this.prisma.vulnerabilityCache.findUnique({
        where: { cacheKey: key },
      });
      if (!entry) return null;
      if (entry.expiresAt <= new Date()) {
        return null;
      }
      return entry.payload as T;
    } catch {
      return null;
    }
  }

  async set(key: string, payload: unknown, ttlMs: number): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + ttlMs);
      await this.prisma.vulnerabilityCache.upsert({
        where: { cacheKey: key },
        create: {
          cacheKey: key,
          payload: payload as Prisma.InputJsonValue,
          expiresAt,
        },
        update: {
          payload: payload as Prisma.InputJsonValue,
          expiresAt,
        },
      });
    } catch {
      // Cache persistence must never fail a scan
    }
  }
}
