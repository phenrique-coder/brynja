import { NextRequest, NextResponse } from 'next/server';
import { getServerContainer } from '@/server/application/container';
import {
  getRequestOrigin,
  resolveOptionalSession,
} from '@/server/http/route-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { githubOAuth } = getServerContainer();
  const origin = getRequestOrigin(req);
  const config = githubOAuth.getConfigSummary(origin);
  const session = resolveOptionalSession(req);

  return NextResponse.json({
    configured: config.configured,
    connected: Boolean(session),
    githubUserId: session?.githubUserId ?? null,
    login: session?.login ?? null,
    name: session?.name ?? null,
    avatarUrl: session?.avatarUrl ?? null,
    profileUrl:
      session?.profileUrl ??
      (session?.login ? `https://github.com/${session.login}` : null),
    sessionExpiresAt: session?.expiresAt ?? null,
    callbackUrl: config.callbackUrl,
    scopes: config.scopes,
  });
}
