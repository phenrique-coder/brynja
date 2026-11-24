import {
  InvalidTargetUrlError,
  SsrfBlockedError,
  UnsafeProbeBlockedError,
} from '../errors/domain.errors';

const ALLOWED_SAFE_METHODS = new Set(['GET', 'HEAD']);
const ALLOWED_SAFE_REQUEST_HEADERS = new Set(['origin', 'accept']);

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

  static parseAndValidateTargetUrl(rawUrl: string): URL {
    let parsed: URL;
    try {
      parsed = new URL(rawUrl.trim());
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

    // IPv6 private / link-local / multicast ranges
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
