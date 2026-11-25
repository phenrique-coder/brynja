import { describe, expect, it } from 'vitest';
import {
  InvalidTargetUrlError,
  SsrfBlockedError,
  UnsafeProbeBlockedError,
} from '../domain/errors/domain.errors';
import { SafeProbePolicy } from '../domain/policies/safe-probe.policy';

describe('SafeProbePolicy', () => {
  describe('assertSafeHttpMethod', () => {
    it('allows GET and HEAD methods', () => {
      expect(SafeProbePolicy.assertSafeHttpMethod('get')).toBe('GET');
      expect(SafeProbePolicy.assertSafeHttpMethod('HEAD')).toBe('HEAD');
    });

    it.each(['POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'])(
      'blocks non-read-only method %s',
      (method) => {
        expect(() => SafeProbePolicy.assertSafeHttpMethod(method)).toThrow(
          UnsafeProbeBlockedError,
        );
      },
    );
  });

  describe('sanitizeSafeRequestHeaders', () => {
    it('allows only Origin and Accept headers', () => {
      expect(
        SafeProbePolicy.sanitizeSafeRequestHeaders({
          origin: 'https://untrusted.vereditosec.test',
          Accept: 'application/json',
        }),
      ).toEqual({
        Origin: 'https://untrusted.vereditosec.test',
        Accept: 'application/json',
      });
    });

    it.each(['Authorization', 'Cookie', 'Host', 'X-Forwarded-For'])(
      'blocks disallowed request header %s',
      (header) => {
        expect(() =>
          SafeProbePolicy.sanitizeSafeRequestHeaders({ [header]: 'value' }),
        ).toThrow(UnsafeProbeBlockedError);
      },
    );

    it('blocks header values containing CRLF characters', () => {
      expect(() =>
        SafeProbePolicy.sanitizeSafeRequestHeaders({
          Origin: 'https://a.test\r\nX-Injected: 1',
        }),
      ).toThrow(UnsafeProbeBlockedError);
    });
  });

  describe('parseAndValidateTargetUrl', () => {
    it('accepts valid http/https URLs', () => {
      const parsed = SafeProbePolicy.parseAndValidateTargetUrl(
        'https://staging.example.com/app',
      );
      expect(parsed.origin).toBe('https://staging.example.com');
    });

    it('rejects non-http protocols and embedded credentials', () => {
      expect(() =>
        SafeProbePolicy.parseAndValidateTargetUrl('file:///etc/passwd'),
      ).toThrow(InvalidTargetUrlError);
      expect(() =>
        SafeProbePolicy.parseAndValidateTargetUrl('https://user:pass@site.com'),
      ).toThrow(InvalidTargetUrlError);
    });
  });

  describe('assertSafeResolvedIp (SSRF protection)', () => {
    it.each([
      '10.0.0.1',
      '172.16.12.4',
      '192.168.1.50',
      '169.254.169.254',
      '100.64.0.1',
      'fe80::1',
      'fc00::1',
    ])('blocks private/metadata IP %s', (ip) => {
      expect(() =>
        SafeProbePolicy.assertSafeResolvedIp(ip, { allowLoopbackTargets: true }),
      ).toThrow(SsrfBlockedError);
    });

    it('blocks loopback IP when allowLoopbackTargets is false', () => {
      expect(() =>
        SafeProbePolicy.assertSafeResolvedIp('127.0.0.1', {
          allowLoopbackTargets: false,
        }),
      ).toThrow(SsrfBlockedError);
      expect(() =>
        SafeProbePolicy.assertSafeResolvedIp('::1', {
          allowLoopbackTargets: false,
        }),
      ).toThrow(SsrfBlockedError);
    });

    it('allows loopback IP only when allowLoopbackTargets is true', () => {
      expect(() =>
        SafeProbePolicy.assertSafeResolvedIp('127.0.0.1', {
          allowLoopbackTargets: true,
        }),
      ).not.toThrow();
    });

    it('allows public routable IPs', () => {
      expect(() =>
        SafeProbePolicy.assertSafeResolvedIp('93.184.216.34', {
          allowLoopbackTargets: false,
        }),
      ).not.toThrow();
    });
  });
});
