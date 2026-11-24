export const TOKEN_CIPHER_PORT = Symbol('TOKEN_CIPHER_PORT');
export const SESSION_TOKEN_CODEC_PORT = Symbol('SESSION_TOKEN_CODEC_PORT');
export const GITHUB_OAUTH_CLIENT_PORT = Symbol('GITHUB_OAUTH_CLIENT_PORT');

export interface EncryptedPayload {
  encryptedToken: string;
  iv: string;
  authTag: string;
}

export interface ITokenCipher {
  encrypt(plaintext: string): EncryptedPayload;
  decrypt(payload: EncryptedPayload): string;
}

export interface GitHubUserProfile {
  id: string;
  login: string;
  name?: string | null;
  avatarUrl: string | null;
  profileUrl?: string | null;
}

export interface GitHubRepoSummary {
  id: number;
  name: string;
  fullName: string;
  htmlUrl: string;
  private: boolean;
  defaultBranch: string;
  updatedAt: string;
}

export interface EphemeralGitHubSession {
  githubUserId: string;
  login: string;
  name?: string | null;
  avatarUrl: string | null;
  profileUrl?: string | null;
  accessToken: string;
  issuedAt: number;
  expiresAt: number;
}

export interface ISessionTokenCodec {
  seal(session: EphemeralGitHubSession): string;
  unseal(token: string | undefined | null): EphemeralGitHubSession | null;
}

export interface GitHubOAuthConfigSummary {
  configured: boolean;
  callbackUrl: string;
  scopes: string;
}

export interface GitHubTokenExchangeResult {
  accessToken: string;
  scope: string;
}

export interface IGitHubOAuthClient {
  isConfigured(): boolean;
  getConfigSummary(): GitHubOAuthConfigSummary;
  buildAuthorizeUrl(state: string): string;
  exchangeCodeForToken(code: string): Promise<GitHubTokenExchangeResult>;
  fetchAuthenticatedUser(accessToken: string): Promise<GitHubUserProfile>;
  listRepositories(accessToken: string): Promise<GitHubRepoSummary[]>;
}
