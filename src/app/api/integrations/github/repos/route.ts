import { NextRequest, NextResponse } from 'next/server';
import { getServerContainer } from '@/server/application/container';
import {
  handleApiError,
  requireGitHubSession,
} from '@/server/http/route-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = requireGitHubSession(req);
    const repos = await getServerContainer().githubOAuth.listRepositories(
      session.accessToken,
    );
    return NextResponse.json(repos);
  } catch (error) {
    return handleApiError(error);
  }
}
