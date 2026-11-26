import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerContainer } from '@/server/application/container';
import { SUPPORTED_ECOSYSTEMS } from '@/server/domain/entities/scan.types';
import {
  handleApiError,
  requireGitHubSession,
} from '@/server/http/route-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const AdviseSchema = z.object({
  repositoryUrl: z.string().min(1).max(500),
  branch: z.string().min(1).max(120).optional().default('main'),
  advisories: z
    .array(
      z.object({
        advisoryId: z.string(),
        cveId: z.string().nullable(),
        packageName: z.string(),
        packageVersion: z.string(),
        ecosystem: z.enum(SUPPORTED_ECOSYSTEMS),
        title: z.string(),
        description: z.string(),
        severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']),
        cvssScore: z.number().nullable(),
        cvssVector: z.string().nullable(),
        cweIds: z.array(z.string()),
        epssScore: z.number().nullable(),
        epssPercentile: z.number().nullable(),
        isKnownExploited: z.boolean(),
        fixedVersion: z.string().nullable(),
        references: z.array(z.string()),
        verdict: z.enum([
          'CONFIRMED_ACTIVE',
          'POTENTIALLY_EXPOSED',
          'DEPENDENCY_ONLY',
        ]),
        source: z.string(),
      }),
    )
    .max(200)
    .default([]),
  probeResults: z
    .array(
      z.object({
        id: z.string(),
        probeId: z.string(),
        title: z.string(),
        severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']),
        status: z.enum(['PASSED', 'FINDING', 'SKIPPED', 'ABORTED']),
        targetUrl: z.string(),
        evidence: z.string(),
        recommendation: z.string(),
        matchedPackage: z.string().nullable(),
        createdAt: z.string(),
      }),
    )
    .max(200)
    .default([]),
  staticFindings: z
    .array(
      z.object({
        id: z.string(),
        ruleId: z.string(),
        category: z.enum([
          'SECRET_LEAK',
          'IAC_MISCONFIG',
          'CI_CD_RISK',
          'SAST_PATTERN',
          'REPO_POSTURE',
        ]),
        severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']),
        title: z.string(),
        description: z.string(),
        filePath: z.string(),
        lineNumber: z.number().nullable(),
        maskedSnippet: z.string().nullable(),
        cweIds: z.array(z.string()),
        recommendation: z.string(),
      }),
    )
    .max(200)
    .optional(),
  byok: z
    .object({
      provider: z.enum(['openai', 'gemini', 'custom']),
      apiKey: z.string().min(6).max(500),
      model: z.string().max(120).optional(),
      endpointUrl: z.string().url().max(300).optional(),
    })
    .nullable()
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = requireGitHubSession(req);
    const body = AdviseSchema.parse(await req.json());
    const result = await getServerContainer().analyzeAdvise.execute({
      repositoryUrl: body.repositoryUrl,
      branch: body.branch,
      accessToken: session.accessToken,
      advisories: body.advisories,
      probeResults: body.probeResults,
      staticFindings: body.staticFindings,
      byok: body.byok,
    });
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
