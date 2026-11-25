import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerContainer } from '@/server/application/container';
import {
  handleApiError,
  requireGitHubSession,
} from '@/server/http/route-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CreateChallengeSchema = z.object({
  targetUrl: z
    .string()
    .url('Informe uma URL válida (ex.: https://staging.app.com)'),
  method: z.enum(['WELL_KNOWN_FILE', 'DNS_TXT', 'LOCAL_DEV_SANDBOX']),
});

export async function POST(req: NextRequest) {
  try {
    const session = requireGitHubSession(req);
    const body = CreateChallengeSchema.parse(await req.json());
    const result = getServerContainer().targetAuthorizations.createChallenge({
      ownerGithubUserId: session.githubUserId,
      targetUrl: body.targetUrl,
      method: body.method,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
