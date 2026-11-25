import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerContainer } from '@/server/application/container';
import {
  handleApiError,
  requireGitHubSession,
} from '@/server/http/route-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const DependencySchema = z.object({
  name: z.string().min(1),
  version: z.string().min(1),
  ecosystem: z.enum(['npm', 'PyPI']),
  purl: z.string(),
  sourceFile: z.string(),
  isDirect: z.boolean(),
});

const AdvisorySchema = z.object({
  advisoryId: z.string(),
  cveId: z.string().nullable(),
  packageName: z.string(),
  packageVersion: z.string(),
  ecosystem: z.enum(['npm', 'PyPI']),
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
});

const RunProbesSchema = z.object({
  scanId: z.string().min(1),
  targetUrl: z.string().url(),
  verificationProof: z.string().min(10),
  dependencies: z.array(DependencySchema).max(5000).default([]),
  advisories: z.array(AdvisorySchema).max(1000).default([]),
});

export async function POST(req: NextRequest) {
  try {
    const session = requireGitHubSession(req);
    const body = RunProbesSchema.parse(await req.json());
    const result = await getServerContainer().runSafeProbes.execute({
      scanId: body.scanId,
      ownerGithubUserId: session.githubUserId,
      targetUrl: body.targetUrl,
      verificationProof: body.verificationProof,
      dependencies: body.dependencies,
      advisories: body.advisories,
    });
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
