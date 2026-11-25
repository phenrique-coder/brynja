import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getServerContainer } from '@/server/application/container';
import {
  getRequestOrigin,
  isHttpsOrigin,
  OAUTH_STATE_COOKIE,
  sanitizeReturnTo,
} from '@/server/http/route-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { githubOAuth } = getServerContainer();
  const origin = getRequestOrigin(req);
  const returnTo = sanitizeReturnTo(req.nextUrl.searchParams.get('returnTo'));

  if (!githubOAuth.isConfigured()) {
    return NextResponse.redirect(
      `${origin}${returnTo}?github_error=${encodeURIComponent(
        'Configure GITHUB_CLIENT_ID e GITHUB_CLIENT_SECRET nas variáveis de ambiente.',
      )}`,
    );
  }

  const state = randomBytes(24).toString('hex');
  const authorizeUrl = githubOAuth.buildAuthorizeUrl(state, origin);

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set(
    OAUTH_STATE_COOKIE,
    JSON.stringify({ state, returnTo }),
    {
      httpOnly: true,
      sameSite: 'lax',
      secure: isHttpsOrigin(origin),
      maxAge: 600,
      path: '/',
    },
  );

  return response;
}
