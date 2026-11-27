import { NextRequest, NextResponse } from 'next/server';
import { getServerContainer } from '@/server/application/container';
import { resolvePresentationAccess } from '@/server/http/presentation-access';
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
  const canViewPresentation = await resolvePresentationAccess(session);

  return NextResponse.json({
    configured: config.configured,
    connected: Boolean(session),
    githubUserId: session?.githubUserId ?? null,
    login: session?.login ?? null,
    name: session?.name ?? null,
    email: session?.email ?? null,
    avatarUrl: session?.avatarUrl ?? null,
    profileUrl:
      session?.profileUrl ??
      (session?.login ? `https://github.com/${session.login}` : null),
    sessionExpiresAt: session?.expiresAt ?? null,
    callbackUrl: config.callbackUrl,
    scopes: session?.scopes?.trim() || config.scopes,
    oauthAppSettingsUrl: config.oauthAppSettingsUrl ?? null,
    canViewPresentation,
  });
}
