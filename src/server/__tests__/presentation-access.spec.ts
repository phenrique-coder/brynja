import { describe, expect, it } from 'vitest';
import {
  allowlistContainsEmail,
  hasConfiguredPresentationAllowlist,
  isPresentationAccessAllowed,
  parsePresentationAllowlist,
} from '../domain/policies/presentation-access.policy';
import { AesTokenCipherService } from '../infrastructure/crypto/aes-token-cipher.service';
import { SealedSessionService } from '../infrastructure/crypto/sealed-session.service';

describe('Presentation access policy (PRESENTATION_ALLOWED_USERS)', () => {
  it('fails closed when the allowlist is empty, missing, or whitespace', () => {
    const user = {
      login: 'pedro',
      email: 'pedro@empresa.com',
      verifiedEmails: ['pedro@empresa.com'],
    };

    expect(parsePresentationAllowlist(undefined)).toEqual([]);
    expect(parsePresentationAllowlist('')).toEqual([]);
    expect(parsePresentationAllowlist('   , ; \n ')).toEqual([]);
    expect(hasConfiguredPresentationAllowlist('')).toBe(false);
    expect(isPresentationAccessAllowed(user, '')).toBe(false);
    expect(isPresentationAccessAllowed(user, undefined)).toBe(false);
  });

  it('denies unauthenticated visitors even when allowlist is populated', () => {
    expect(isPresentationAccessAllowed(null, 'pedro,ceo@empresa.com')).toBe(
      false,
    );
    expect(
      isPresentationAccessAllowed(undefined, 'pedro,ceo@empresa.com'),
    ).toBe(false);
  });

  it('matches GitHub login case-insensitively with or without leading @', () => {
    const allowlist = ' @PedroDev , diretoria@empresa.com ';

    expect(
      isPresentationAccessAllowed(
        { login: 'pedrodev', email: null, verifiedEmails: [] },
        allowlist,
      ),
    ).toBe(true);

    expect(
      isPresentationAccessAllowed(
        { login: 'PEDRODEV', email: null, verifiedEmails: [] },
        allowlist,
      ),
    ).toBe(true);

    expect(
      isPresentationAccessAllowed(
        { login: 'pedrodev-extra', email: null, verifiedEmails: [] },
        allowlist,
      ),
    ).toBe(false);
  });

  it('matches primary email and secondary verified GitHub emails', () => {
    const allowlist = 'cto@empresa.com.br;ti-lead@corp.org';
    expect(allowlistContainsEmail(allowlist)).toBe(true);
    expect(allowlistContainsEmail('octocat,pedro')).toBe(false);

    expect(
      isPresentationAccessAllowed(
        {
          login: 'random-handle',
          email: 'personal@gmail.com',
          verifiedEmails: ['personal@gmail.com', 'CTO@EMPRESA.COM.BR'],
        },
        allowlist,
      ),
    ).toBe(true);

    expect(
      isPresentationAccessAllowed(
        {
          login: 'outsider',
          email: 'outsider@other.com',
          verifiedEmails: ['outsider@other.com'],
        },
        allowlist,
      ),
    ).toBe(false);
  });
});

describe('SealedSessionService verified email persistence', () => {
  it('seals and unseals email, verifiedEmails, and scopes cleanly', () => {
    const cipher = new AesTokenCipherService(
      '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    );
    const codec = new SealedSessionService(cipher);
    const now = Date.now();

    const sealed = codec.seal({
      githubUserId: '42',
      login: 'pedro',
      name: 'Pedro',
      email: 'pedro@empresa.com',
      verifiedEmails: ['pedro@empresa.com', 'pedro@users.noreply.github.com'],
      avatarUrl: null,
      profileUrl: 'https://github.com/pedro',
      accessToken: 'gho_test_token',
      scopes: 'repo read:user user:email read:org',
      issuedAt: now,
      expiresAt: now + 60_000,
    });

    const unsealed = codec.unseal(sealed);
    expect(unsealed).not.toBeNull();
    expect(unsealed?.email).toBe('pedro@empresa.com');
    expect(unsealed?.verifiedEmails).toEqual([
      'pedro@empresa.com',
      'pedro@users.noreply.github.com',
    ]);
    expect(unsealed?.scopes).toBe('repo read:user user:email read:org');
  });
});
