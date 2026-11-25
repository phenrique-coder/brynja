export interface ParsedDraftTarget {
  origin: string;
  hostname: string;
  isLoopback: boolean;
}

export interface OwnershipGuideSnippetsInput {
  origin: string;
  hostname: string;
  token: string;
  dnsAltComment: string;
}

export interface OwnershipGuideSnippets {
  wellKnownUrl: string;
  sshConnectCmd: string;
  sshCreateFileCmd: string;
  nginxSnippet: string;
  nginxReloadCmd: string;
  curlVerifyCmd: string;
  sshCleanupFileCmd: string;
  nginxFindBlockCmd: string;
  curlCleanupVerifyCmd: string;
  webCleanupCmd: string;
  dnsRecordHost: string;
  dnsVerifyCmd: string;
  sandboxEnvLine: string;
  fileContent: string;
}

const DNS_LABEL_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;
const TLD_LABEL_RE = /^(?:[a-z]{2,}|xn--[a-z0-9-]{2,})$/i;
const IPV6_BRACKETED_RE = /^\[[0-9a-f:]+\]$/i;

function isValidIpv4(host: string): boolean {
  const parts = host.split('.');
  if (parts.length !== 4) return false;
  return parts.every((part) => {
    if (!/^\d{1,3}$/.test(part)) return false;
    const n = Number(part);
    return n >= 0 && n <= 255;
  });
}

function isLoopbackHost(hostname: string): boolean {
  const clean = hostname.toLowerCase();
  if (clean === 'localhost' || clean.endsWith('.localhost')) {
    return true;
  }
  if (clean === '[::1]' || clean === '::1') {
    return true;
  }
  if (isValidIpv4(clean)) {
    return clean.startsWith('127.');
  }
  return false;
}

function isCompleteSafeHostname(hostname: string): boolean {
  const clean = hostname.toLowerCase();
  if (!clean || /\s/.test(clean)) return false;

  if (clean === 'localhost') return true;
  if (IPV6_BRACKETED_RE.test(clean)) return true;
  if (isValidIpv4(clean)) return true;

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

/**
 * Pure URL parser for live snippet preview on /authorizations.
 * Accepts full http(s) URLs or bare complete hostnames/loopback addresses,
 * rejects embedded credentials and shell-unsafe hostnames, and returns
 * normalized origin/hostname ready for terminal commands.
 */
export function parseDraftTargetUrl(rawInput: string): ParsedDraftTarget | null {
  const trimmed = rawInput.trim();
  if (!trimmed || /\s/.test(trimmed)) return null;

  let candidate = trimmed;

  if (trimmed.includes('://')) {
    if (!/^https?:\/\//i.test(trimmed)) {
      return null;
    }
  } else {
    // Reject partial http:/https: typing or non-http schemes (e.g. javascript:, mailto:, ftp:)
    if (/^https?:/i.test(trimmed)) {
      return null;
    }
    const isBracketedIpv6 = /^\[[0-9a-f:]+\](?::\d+)?(?:\/.*)?$/i.test(trimmed);
    if (!isBracketedIpv6) {
      const colonIdx = trimmed.indexOf(':');
      if (colonIdx !== -1) {
        const afterColon = trimmed.slice(colonIdx + 1);
        if (!/^\d+(?:\/|$)/.test(afterColon)) {
          return null;
        }
      }
    }

    const hostProbe = isBracketedIpv6
      ? trimmed.slice(0, trimmed.indexOf(']') + 1)
      : trimmed.split(/[/:?#]/)[0];
    const defaultProtocol = isLoopbackHost(hostProbe) ? 'http://' : 'https://';
    candidate = `${defaultProtocol}${trimmed}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return null;
  }
  if (parsed.username || parsed.password) {
    return null;
  }
  if (!isCompleteSafeHostname(parsed.hostname)) {
    return null;
  }

  return {
    origin: parsed.origin,
    hostname: parsed.hostname,
    isLoopback: isLoopbackHost(parsed.hostname),
  };
}

/**
 * Escapes single quotes for safe POSIX single-quoted string interpolation.
 */
export function escapeShellSingleQuoted(value: string): string {
  return value.replace(/'/g, `'\\''`);
}

export function buildOwnershipGuideSnippets(
  input: OwnershipGuideSnippetsInput,
): OwnershipGuideSnippets {
  const { origin, hostname, token, dnsAltComment } = input;
  const safeToken = escapeShellSingleQuoted(token);
  const wellKnownUrl = `${origin}/.well-known/brynja-verify.txt`;

  return {
    wellKnownUrl,
    sshConnectCmd: `ssh usuario@${hostname}`,
    sshCreateFileCmd: `sudo mkdir -p /var/www/html/.well-known && printf '%s\\n' '${safeToken}' | sudo tee /var/www/html/.well-known/brynja-verify.txt > /dev/null`,
    nginxSnippet: `location ^~ /.well-known/ {
    root /var/www/html;
    default_type text/plain;
    allow all;
}`,
    nginxReloadCmd: `sudo nginx -t && sudo systemctl reload nginx`,
    curlVerifyCmd: `curl -fsSL ${wellKnownUrl}`,
    sshCleanupFileCmd: `sudo rm -f /var/www/html/.well-known/brynja-verify.txt && (sudo rmdir /var/www/html/.well-known 2>/dev/null || true)`,
    nginxFindBlockCmd: `sudo grep -rn "well-known" /etc/nginx/sites-available/ /etc/nginx/conf.d/ 2>/dev/null`,
    curlCleanupVerifyCmd: `curl -i ${wellKnownUrl}`,
    webCleanupCmd: `rm -f public/.well-known/brynja-verify.txt && (rmdir public/.well-known 2>/dev/null || true)`,
    dnsRecordHost: `_brynja.${hostname}`,
    dnsVerifyCmd: `dig +short TXT _brynja.${hostname}\n${dnsAltComment}\nnslookup -type=TXT _brynja.${hostname}`,
    sandboxEnvLine: `ALLOW_LOCAL_LOOPBACK_TARGETS=true`,
    fileContent: token,
  };
}
