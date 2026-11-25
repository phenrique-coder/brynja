import { NextRequest, NextResponse } from 'next/server';
import { getServerContainer } from '@/server/application/container';
import {
  getRequestOrigin,
  GITHUB_SESSION_COOKIE,
  isHttpsOrigin,
  OAUTH_STATE_COOKIE,
  sanitizeReturnTo,
} from '@/server/http/route-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SESSION_MAX_LIFETIME_MS = 12 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  const { githubOAuth, sessionCodec } = getServerContainer();
  const origin = getRequestOrigin(req);

  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');
  const oauthError = req.nextUrl.searchParams.get('error');

  let expectedState: string | null = null;
  let returnTo = '/';

  const rawStateCookie = req.cookies.get(OAUTH_STATE_COOKIE)?.value;
  if (rawStateCookie) {
    try {
      const parsed = JSON.parse(rawStateCookie) as {
        state?: string;
        returnTo?: string;
      };
      expectedState = parsed.state ?? null;
      returnTo = sanitizeReturnTo(parsed.returnTo);
    } catch {
      expectedState = null;
    }
  }

  const failRedirect = (message: string) => {
    const res = NextResponse.redirect(
      `${origin}${returnTo}?github_error=${encodeURIComponent(message)}`,
    );
    res.cookies.delete(OAUTH_STATE_COOKIE);
    return res;
  };

  if (oauthError) {
    return failRedirect(`Autorização GitHub cancelada (${oauthError}).`);
  }

  if (!code || !state || !expectedState || state !== expectedState) {
    return failRedirect(
      'Validação CSRF de estado OAuth falhou. Tente conectar novamente.',
    );
  }

  try {
    const tokenRes = await githubOAuth.exchangeCodeForToken(code, origin);
    const user = await githubOAuth.fetchAuthenticatedUser(tokenRes.accessToken);
    const now = Date.now();

    const sealedSession = sessionCodec.seal({
      githubUserId: user.id,
      login: user.login,
      name: user.name ?? null,
      avatarUrl: user.avatarUrl,
      profileUrl: user.profileUrl ?? `https://github.com/${user.login}`,
      accessToken: tokenRes.accessToken,
      issuedAt: now,
      expiresAt: now + SESSION_MAX_LIFETIME_MS,
    });

    const response = NextResponse.redirect(`${origin}${returnTo}`);
    response.cookies.delete(OAUTH_STATE_COOKIE);

    // Ephemeral browser-session cookie: NO maxAge / NO expires! Token is never saved in any DB.
    response.cookies.set(GITHUB_SESSION_COOKIE, sealedSession, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isHttpsOrigin(origin),
      path: '/',
    });

    return response;
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : 'Falha ao concluir login no GitHub.';
    return failRedirect(msg);
  }
}
