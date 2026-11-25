import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerContainer } from '@/server/application/container';
import {
  handleApiError,
  requireGitHubSession,
} from '@/server/http/route-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PreviewChallengeSchema = z.object({
  targetUrl: z
    .string()
    .trim()
    .min(1, 'Informe uma URL ou domínio válido (ex.: staging.app.com)'),
});

export async function POST(req: NextRequest) {
  try {
    const session = requireGitHubSession(req);
    const body = PreviewChallengeSchema.parse(await req.json());
    const result =
      getServerContainer().targetAuthorizations.previewChallengeToken({
        ownerGithubUserId: session.githubUserId,
        targetUrl: body.targetUrl,
      });

    return NextResponse.json(result, {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
