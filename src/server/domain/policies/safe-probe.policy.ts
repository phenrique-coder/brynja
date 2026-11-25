import {
  InvalidTargetUrlError,
  SsrfBlockedError,
  UnsafeProbeBlockedError,
} from '../errors/domain.errors';

const ALLOWED_SAFE_METHODS = new Set(['GET', 'HEAD']);
const ALLOWED_SAFE_REQUEST_HEADERS = new Set(['origin', 'accept']);
const DNS_LABEL_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;
const TLD_LABEL_RE = /^(?:[a-z]{2,}|xn--[a-z0-9-]{2,})$/i;
const IPV6_BRACKETED_RE = /^\[[0-9a-f:]+\]$/i;

export interface NetworkSafetyOptions {
  allowLoopbackTargets: boolean;
}

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  let value = 0;
  for (const part of parts) {
    if (!/^\d+$/.test(part)) return null;
    const octet = Number(part);
    if (octet < 0 || octet > 255) return null;
    value = (value << 8) | octet;
  }
  return value >>> 0;
}

function inCidr4(ipInt: number, baseIp: string, prefix: number): boolean {
  const baseInt = ipv4ToInt(baseIp);
  if (baseInt === null) return false;
  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  return (ipInt & mask) === (baseInt & mask);
}

export class SafeProbePolicy {
  static assertSafeHttpMethod(method: string): 'GET' | 'HEAD' {
    const normalized = method.toUpperCase();
    if (!ALLOWED_SAFE_METHODS.has(normalized)) {
      throw new UnsafeProbeBlockedError(
        `Método HTTP "${method}" bloqueado pela SafeProbePolicy. Apenas GET e HEAD são permitidos.`,
      );
    }
    return normalized as 'GET' | 'HEAD';
  }

  static sanitizeSafeRequestHeaders(
    headers?: Record<string, string>,
  ): Record<string, string> {
    if (!headers) return {};

    const sanitized: Record<string, string> = {};
    for (const [rawKey, rawValue] of Object.entries(headers)) {
      const key = rawKey.trim().toLowerCase();
      if (!ALLOWED_SAFE_REQUEST_HEADERS.has(key)) {
        throw new UnsafeProbeBlockedError(
          `Cabeçalho HTTP "${rawKey}" bloqueado pela SafeProbePolicy. Apenas Origin e Accept são permitidos em sondas.`,
        );
      }
      if (/[\r\n]/.test(rawValue)) {
        throw new UnsafeProbeBlockedError(
          `Valor inválido no cabeçalho "${rawKey}" bloqueado pela SafeProbePolicy.`,
        );
      }
      sanitized[key === 'origin' ? 'Origin' : 'Accept'] = rawValue.trim();
    }

    return sanitized;
  }

  private static isValidTargetHostname(hostname: string): boolean {
    const clean = hostname.toLowerCase();
    if (!clean || /\s/.test(clean)) return false;

    if (clean === 'localhost') return true;
    if (IPV6_BRACKETED_RE.test(clean)) return true;
    if (ipv4ToInt(clean) !== null) return true;

    if (clean.endsWith('.localhost')) {
      const subLabels = clean.slice(0, -'.localhost'.length).split('.');
      return subLabels.length > 0 && subLabels.every((l) => DNS_LABEL_RE.test(l));
    }

    const labels = clean.split('.');
    if (labels.length < 2) return false;
    if (!labels.every((label) => DNS_LABEL_RE.test(label))) return false;

    const tld = labels[labels.length - 1];
    return TLD_LABEL_RE.test(tld);
  }

  static parseAndValidateTargetUrl(rawUrl: string): URL {
    const trimmed = rawUrl.trim();
    if (!trimmed || /\s/.test(trimmed)) {
      throw new InvalidTargetUrlError(`URL alvo inválida: "${rawUrl}"`);
    }

    let candidate = trimmed;

    if (!trimmed.includes('://')) {
      if (/^https?:/i.test(trimmed)) {
        throw new InvalidTargetUrlError(`URL alvo inválida: "${rawUrl}"`);
      }

      const isBracketedIpv6 = /^\[[0-9a-f:]+\](?::\d+)?(?:\/.*)?$/i.test(
        trimmed,
      );
      if (!isBracketedIpv6) {
        const colonIdx = trimmed.indexOf(':');
        if (colonIdx !== -1) {
          const afterColon = trimmed.slice(colonIdx + 1);
          if (!/^\d+(?:\/|$)/.test(afterColon)) {
            throw new InvalidTargetUrlError(`URL alvo inválida: "${rawUrl}"`);
          }
        }
      }

      const hostProbe = isBracketedIpv6
        ? trimmed.slice(0, trimmed.indexOf(']') + 1)
        : trimmed.split(/[/:?#]/)[0];
      const defaultProtocol = SafeProbePolicy.isLoopbackHostnameOrIp(hostProbe)
        ? 'http://'
        : 'https://';
      candidate = `${defaultProtocol}${trimmed}`;
    }

    let parsed: URL;
    try {
      parsed = new URL(candidate);
    } catch {
      throw new InvalidTargetUrlError(`URL alvo inválida: "${rawUrl}"`);
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new InvalidTargetUrlError(
        `Protocolo "${parsed.protocol}" não permitido. Use http: ou https:.`,
      );
    }

    if (parsed.username || parsed.password) {
      throw new InvalidTargetUrlError(
        'Credenciais embutidas na URL alvo não são permitidas.',
      );
    }

    if (!SafeProbePolicy.isValidTargetHostname(parsed.hostname)) {
      throw new InvalidTargetUrlError(`URL alvo inválida: "${rawUrl}"`);
    }

    return parsed;
  }

  static isLoopbackHostnameOrIp(hostOrIp: string): boolean {
    const clean = hostOrIp.toLowerCase().replace(/^\[|\]$/g, '');
    if (clean === 'localhost' || clean.endsWith('.localhost')) {
      return true;
    }
    if (clean === '::1' || clean === '0:0:0:0:0:0:0:1') {
      return true;
    }
    if (clean.startsWith('::ffff:')) {
      return SafeProbePolicy.isLoopbackHostnameOrIp(clean.slice(7));
    }
    const v4 = ipv4ToInt(clean);
    if (v4 !== null) {
      return inCidr4(v4, '127.0.0.0', 8);
    }
    return false;
  }

  static assertSafeResolvedIp(ip: string, options: NetworkSafetyOptions): void {
    const clean = ip.toLowerCase().replace(/^\[|\]$/g, '');

    if (clean.startsWith('::ffff:')) {
      SafeProbePolicy.assertSafeResolvedIp(clean.slice(7), options);
      return;
    }

    if (SafeProbePolicy.isLoopbackHostnameOrIp(clean)) {
      if (!options.allowLoopbackTargets) {
        throw new SsrfBlockedError(
          `Endereço loopback (${clean}) bloqueado pela política SSRF.`,
        );
      }
      return;
    }

    const v4 = ipv4ToInt(clean);
    if (v4 !== null) {
      const blockedCidrs: Array<[string, number, string]> = [
        ['0.0.0.0', 8, 'this-network'],
        ['10.0.0.0', 8, 'RFC1918 private'],
        ['100.64.0.0', 10, 'CGNAT'],
        ['127.0.0.0', 8, 'loopback'],
        ['169.254.0.0', 16, 'link-local / cloud metadata'],
        ['172.16.0.0', 12, 'RFC1918 private'],
        ['192.0.0.0', 24, 'IETF protocol assignments'],
        ['192.168.0.0', 16, 'RFC1918 private'],
        ['224.0.0.0', 4, 'multicast'],
        ['240.0.0.0', 4, 'reserved'],
      ];

      for (const [base, prefix, label] of blockedCidrs) {
        if (inCidr4(v4, base, prefix)) {
          throw new SsrfBlockedError(
            `IP ${clean} (${label}) bloqueado pela política anti-SSRF.`,
          );
        }
      }
      return;
    }

    if (
      clean === '::' ||
      clean.startsWith('fe80:') ||
      clean.startsWith('fc') ||
      clean.startsWith('fd') ||
      clean.startsWith('ff')
    ) {
      throw new SsrfBlockedError(
        `Endereço IPv6 restrito (${clean}) bloqueado pela política anti-SSRF.`,
      );
    }
  }
}
