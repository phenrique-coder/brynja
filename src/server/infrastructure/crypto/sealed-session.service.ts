import {
  EphemeralGitHubSession,
  ISessionTokenCodec,
  ITokenCipher,
} from '../../domain/ports/server.ports';

export class SealedSessionService implements ISessionTokenCodec {
  constructor(private readonly cipher: ITokenCipher) {}

  seal(session: EphemeralGitHubSession): string {
    const serialized = JSON.stringify(session);
    const payload = this.cipher.encrypt(serialized);
    return `v1.${payload.iv}.${payload.authTag}.${payload.encryptedToken}`;
  }

  unseal(token: string | undefined | null): EphemeralGitHubSession | null {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 4 || parts[0] !== 'v1') return null;

    const [, iv, authTag, encryptedToken] = parts;
    if (!iv || !authTag || !encryptedToken) return null;

    try {
      const plaintext = this.cipher.decrypt({ iv, authTag, encryptedToken });
      const parsed = JSON.parse(plaintext) as Partial<EphemeralGitHubSession>;
      if (
        !parsed.githubUserId ||
        !parsed.login ||
        !parsed.accessToken ||
        typeof parsed.expiresAt !== 'number'
      ) {
        return null;
      }
      if (parsed.expiresAt <= Date.now()) {
        return null;
      }
      return {
        githubUserId: parsed.githubUserId,
        login: parsed.login,
        name: parsed.name ?? null,
        avatarUrl: parsed.avatarUrl ?? null,
        profileUrl: parsed.profileUrl ?? null,
        accessToken: parsed.accessToken,
        issuedAt: parsed.issuedAt ?? Date.now(),
        expiresAt: parsed.expiresAt,
      };
    } catch {
      return null;
    }
  }
}
