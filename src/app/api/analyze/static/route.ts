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

const AnalyzeStaticSchema = z.object({
  repositoryUrl: z.string().min(1, 'repositoryUrl é obrigatório').max(500),
  branch: z.string().min(1).max(120).optional().default('main'),
});

export async function POST(req: NextRequest) {
  try {
    const session = requireGitHubSession(req);
    const body = AnalyzeStaticSchema.parse(await req.json());
    const result = await getServerContainer().analyzeStatic.execute({
      repositoryUrl: body.repositoryUrl,
      branch: body.branch,
      accessToken: session.accessToken,
    });
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
