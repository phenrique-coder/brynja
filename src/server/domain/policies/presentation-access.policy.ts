import type { EphemeralGitHubSession } from '../ports/server.ports';

export const PRESENTATION_ALLOWED_USERS_ENV = 'PRESENTATION_ALLOWED_USERS';

/**
 * Normalizes a single allowlist entry from `PRESENTATION_ALLOWED_USERS`.
 * Supports GitHub usernames (`octocat` or `@octocat`) and email addresses (`user@corp.com`).
 */
function normalizeAllowlistEntry(rawEntry: string): string {
  const trimmed = rawEntry.trim().toLowerCase();
  if (!trimmed) return '';
  // Strip leading '@' for GitHub handle notation (e.g. "@pedro"),
  // while keeping email addresses ("user@domain.com") intact.
  if (trimmed.startsWith('@') && !trimmed.slice(1).includes('@')) {
    return trimmed.slice(1).trim();
  }
  return trimmed;
}

/**
 * Parses the comma/semicolon/newline-separated allowlist from `.env`.
 */
export function parsePresentationAllowlist(
  rawValue: string | null | undefined = process.env[
    PRESENTATION_ALLOWED_USERS_ENV
  ],
): string[] {
  if (!rawValue) return [];
  const entries = rawValue
    .split(/[\s,;]+/)
    .map(normalizeAllowlistEntry)
    .filter(Boolean);
  return Array.from(new Set(entries));
}

export function hasConfiguredPresentationAllowlist(
  rawValue: string | null | undefined = process.env[
    PRESENTATION_ALLOWED_USERS_ENV
  ],
): boolean {
  return parsePresentationAllowlist(rawValue).length > 0;
}

export function allowlistContainsEmail(
  rawValue: string | null | undefined = process.env[
    PRESENTATION_ALLOWED_USERS_ENV
  ],
): boolean {
  return parsePresentationAllowlist(rawValue).some((entry) =>
    entry.includes('@'),
  );
}

export type PresentationIdentity = Pick<
  EphemeralGitHubSession,
  'login' | 'email' | 'verifiedEmails'
>;

/**
 * Strict fail-closed access policy for `/presentation`.
 *
 * - Empty or missing `PRESENTATION_ALLOWED_USERS` denies everyone (`false`).
 * - Unauthenticated users are always denied (`false`).
 * - Matches case-insensitively against the authenticated GitHub `@login`,
 *   primary `email`, or any verified GitHub email address (`verifiedEmails`).
 */
export function isPresentationAccessAllowed(
  session: PresentationIdentity | null | undefined,
  rawAllowlist: string | null | undefined = process.env[
    PRESENTATION_ALLOWED_USERS_ENV
  ],
): boolean {
  if (!session) return false;

  const allowlist = parsePresentationAllowlist(rawAllowlist);
  if (allowlist.length === 0) {
    return false;
  }

  const allowedSet = new Set(allowlist);
  const candidates = new Set<string>();

  if (session.login?.trim()) {
    candidates.add(session.login.trim().toLowerCase());
  }
  if (session.email?.trim()) {
    candidates.add(session.email.trim().toLowerCase());
  }
  if (Array.isArray(session.verifiedEmails)) {
    for (const email of session.verifiedEmails) {
      if (typeof email === 'string' && email.trim()) {
        candidates.add(email.trim().toLowerCase());
      }
    }
  }

  for (const candidate of candidates) {
    if (allowedSet.has(candidate)) {
      return true;
    }
  }

  return false;
}
