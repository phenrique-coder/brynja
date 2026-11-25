import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { getServerContainer } from '../application/container';
import {
  DomainError,
  GitHubNotConnectedError,
} from '../domain/errors/domain.errors';
import { EphemeralGitHubSession } from '../domain/ports/server.ports';

export const GITHUB_SESSION_COOKIE = 'brynja_gh_session';
export const OAUTH_STATE_COOKIE = 'brynja_gh_oauth_state';

export function getRequestOrigin(req: NextRequest): string {
  const forwardedHost = req.headers.get('x-forwarded-host');
  const forwardedProto = req.headers.get('x-forwarded-proto') ?? 'https';
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }
  if (req.nextUrl?.origin && req.nextUrl.origin !== 'null') {
    return req.nextUrl.origin;
  }
  if (process.env.APP_URL?.trim()) {
    return process.env.APP_URL.trim().replace(/\/+$/, '');
  }
  if (process.env.VERCEL_URL?.trim()) {
    return `https://${process.env.VERCEL_URL.trim()}`;
  }
  return 'http://localhost:3000';
}

export function isHttpsOrigin(origin: string): boolean {
  return origin.toLowerCase().startsWith('https://');
}

export function sanitizeReturnTo(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) {
    return '/';
  }
  return raw;
}

export function resolveOptionalSession(
  req: NextRequest,
): EphemeralGitHubSession | null {
  const raw = req.cookies.get(GITHUB_SESSION_COOKIE)?.value;
  return getServerContainer().sessionCodec.unseal(raw);
}

export function requireGitHubSession(req: NextRequest): EphemeralGitHubSession {
  const session = resolveOptionalSession(req);
  if (!session) {
    throw new GitHubNotConnectedError(
      'Sessão GitHub expirada ou não conectada. Faça login com sua conta GitHub para continuar.',
    );
  }
  return session;
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof DomainError) {
    return NextResponse.json(
      {
        error: error.code,
        message: error.message,
      },
      { status: error.statusCode },
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'VALIDATION_ERROR',
        message: 'Dados de entrada inválidos.',
        issues: error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      },
      { status: 400 },
    );
  }

  const message =
    error instanceof Error ? error.message : 'Erro interno inesperado.';
  return NextResponse.json(
    {
      error: 'INTERNAL_SERVER_ERROR',
      message,
    },
    { status: 500 },
  );
}
