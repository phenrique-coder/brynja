import { getServerContainer } from '../application/container';
import {
  allowlistContainsEmail,
  isPresentationAccessAllowed,
} from '../domain/policies/presentation-access.policy';
import type { EphemeralGitHubSession } from '../domain/ports/server.ports';

/**
 * Evaluates whether the authenticated GitHub session is allowed to access `/presentation`.
 *
 * Strictly fail-closed via `PRESENTATION_ALLOWED_USERS`.
 * Falls back once to fetching verified GitHub emails when the allowlist contains
 * email entries and an existing session cookie predates `verifiedEmails`.
 */
export async function resolvePresentationAccess(
  session: EphemeralGitHubSession | null | undefined,
): Promise<boolean> {
  if (!session) return false;
  if (isPresentationAccessAllowed(session)) {
    return true;
  }

  const hasStoredEmails =
    Boolean(session.email) ||
    (Array.isArray(session.verifiedEmails) &&
      session.verifiedEmails.length > 0);

  if (!hasStoredEmails && allowlistContainsEmail() && session.accessToken) {
    const { githubOAuth } = getServerContainer();
    const verifiedEmails = await githubOAuth.fetchVerifiedEmails(
      session.accessToken,
    );
    if (verifiedEmails.length > 0) {
      return isPresentationAccessAllowed({
        ...session,
        email: verifiedEmails[0] ?? null,
        verifiedEmails,
      });
    }
  }

  return false;
}
