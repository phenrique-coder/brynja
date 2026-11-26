import { randomUUID } from 'node:crypto';
import * as path from 'node:path';
import {
  RepositoryFile,
  SeverityLevel,
  StaticAnalysisFinding,
} from '../../domain/entities/scan.types';
import { IStaticAnalyzer } from '../../domain/ports/server.ports';

interface SecretRule {
  ruleId: string;
  title: string;
  severity: SeverityLevel;
  pattern: RegExp;
  cweIds: string[];
  recommendation: string;
}

const SECRET_RULES: SecretRule[] = [
  {
    ruleId: 'secret:private-key-block',
    title: 'Chave privada criptográfica versionada no repositório',
    severity: 'CRITICAL',
    pattern: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/,
    cweIds: ['CWE-798', 'CWE-321'],
    recommendation:
      'Revogue imediatamente a chave privada exposta, remova o arquivo do histórico Git e utilize cofre de segredos ou variáveis de ambiente.',
  },
  {
    ruleId: 'secret:aws-access-key',
    title: 'Possível AWS Access Key ID exposta no código',
    severity: 'CRITICAL',
    pattern: /\b(AKIA[0-9A-Z]{16})\b/,
    cweIds: ['CWE-798'],
    recommendation:
      'Revogue e rotacione a credencial IAM na AWS, migre para IAM Roles/OIDC e remova a chave do código-fonte.',
  },
  {
    ruleId: 'secret:github-token',
    title: 'Token de acesso GitHub (PAT) exposto no código',
    severity: 'CRITICAL',
    pattern: /\b(gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{24,})\b/,
    cweIds: ['CWE-798'],
    recommendation:
      'Revogue o token nas configurações do GitHub imediatamente e utilize GitHub Actions Secrets / OAuth efêmero.',
  },
  {
    ruleId: 'secret:stripe-live-key',
    title: 'Chave de produção Stripe (sk_live) exposta',
    severity: 'CRITICAL',
    pattern: /\b(sk_live_[0-9a-zA-Z]{20,})\b/,
    cweIds: ['CWE-798'],
    recommendation:
      'Rotacione a chave secreta no painel Stripe imediatamente e mova para variáveis de ambiente seguras.',
  },
  {
    ruleId: 'secret:google-api-key',
    title: 'Chave de API Google / GCP (AIza...) hardcoded',
    severity: 'HIGH',
    pattern: /\b(AIza[0-9A-Za-z\-_]{35})\b/,
    cweIds: ['CWE-798'],
    recommendation:
      'Restrinja ou rotacione a chave de API no Google Cloud Console e mova para variáveis de ambiente no servidor.',
  },
  {
    ruleId: 'secret:slack-token',
    title: 'Token de integração Slack exposto',
    severity: 'HIGH',
    pattern: /\b(xox[baprs]-[0-9A-Za-z-]{10,})\b/,
    cweIds: ['CWE-798'],
    recommendation:
      'Revogue o token do app Slack e armazene credenciais apenas em gerenciador de segredos.',
  },
  {
    ruleId: 'secret:db-connection-credentials',
    title: 'String de conexão com senha embutida no código/configuração',
    severity: 'HIGH',
    pattern:
      /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis):\/\/[^:\s'"`]+:([^@\s'"`]{6,})@[^/\s'"`]+/i,
    cweIds: ['CWE-798', 'CWE-259'],
    recommendation:
      'Rotacione a senha do banco de dados e utilize DATABASE_URL injetada via runtime/secret manager.',
  },
  {
    ruleId: 'secret:generic-secret-assignment',
    title: 'Possível segredo ou senha hardcoded em atribuição',
    severity: 'MEDIUM',
    pattern:
      /\b(?:api[_-]?secret|client[_-]?secret|jwt[_-]?secret|encryption[_-]?key|db[_-]?password|token_encryption_key)\b\s*[:=]\s*["']([A-Za-z0-9+/=_-]{16,})["']/i,
    cweIds: ['CWE-798'],
    recommendation:
      'Substitua segredos literais por variáveis de ambiente (process.env / os.environ) e rotacione o valor caso seja real.',
  },
];

const PLACEHOLDER_TOKENS = [
  'example',
  'sample',
  'dummy',
  'test',
  'placeholder',
  'changeme',
  'your_',
  'seu_',
  'xxxxx',
  '000000',
  '123456',
];

const SKIPPED_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.ico',
  '.woff',
  '.woff2',
  '.pdf',
  '.lock',
]);

function isPlaceholder(secret: string): boolean {
  const lower = secret.toLowerCase();
  if (PLACEHOLDER_TOKENS.some((t) => lower.includes(t))) return true;
  if (/^(.)\1{5,}$/.test(secret)) return true;
  return false;
}

export function maskSecretMatch(secret: string): string {
  const clean = secret.trim();
  if (clean.includes('PRIVATE KEY')) {
    return '-----BEGIN **** PRIVATE KEY----- [REDACTED]';
  }
  if (clean.length <= 8) return '********';
  return `${clean.slice(0, 4)}****${clean.slice(-4)}`;
}

export class SecretScannerAnalyzer implements IStaticAnalyzer {
  readonly id = 'static:secret-scanner';

  supports(filePath: string): boolean {
    const base = path.posix.basename(filePath).toLowerCase();
    if (
      base === '.env.example' ||
      base === '.env.sample' ||
      base === '.env.template' ||
      base.endsWith('-lock.yaml') ||
      base === 'package-lock.json' ||
      base === 'yarn.lock' ||
      base === 'cargo.lock' ||
      base === 'go.sum'
    ) {
      return false;
    }
    const ext = path.posix.extname(base);
    return !SKIPPED_EXTENSIONS.has(ext);
  }

  async analyze(files: RepositoryFile[]): Promise<StaticAnalysisFinding[]> {
    const findings: StaticAnalysisFinding[] = [];

    for (const file of files) {
      if (!this.supports(file.path)) continue;
      const base = path.posix.basename(file.path).toLowerCase();
      const isTestFixture = /(?:^|\/)(?:__tests__|tests?|fixtures?|mocks?)\//i.test(
        file.path,
      ) || /\.(?:spec|test)\.[tj]sx?$/i.test(base);
      if (isTestFixture) continue;

      if (base === '.env' || base === '.env.local' || base === '.env.production') {
        findings.push({
          id: randomUUID(),
          ruleId: 'secret:committed-dotenv',
          category: 'SECRET_LEAK',
          severity: 'CRITICAL',
          title: `Arquivo de ambiente sensível versionado (${base})`,
          description:
            'Arquivos .env reais commitados no repositório expõem segredos operacionais a qualquer pessoa ou pipeline com acesso de leitura.',
          filePath: file.path,
          lineNumber: 1,
          maskedSnippet: `${base} [conteúdo omitido por segurança]`,
          cweIds: ['CWE-312', 'CWE-540'],
          recommendation:
            'Adicione .env* ao .gitignore, remova o arquivo do índice Git e rotacione todas as chaves contidas nele.',
        });
        continue;
      }

      const lines = file.content.split(/\r?\n/);
      for (let i = 0; i < lines.length; i += 1) {
        const line = lines[i];
        if (line.length > 1000) continue;

        for (const rule of SECRET_RULES) {
          const match = rule.pattern.exec(line);
          if (!match) continue;
          const captured = match[1] ?? match[0];
          if (isPlaceholder(captured)) continue;

          findings.push({
            id: randomUUID(),
            ruleId: rule.ruleId,
            category: 'SECRET_LEAK',
            severity: rule.severity,
            title: rule.title,
            description: `Padrão compatível com credencial sensível detectado em ${file.path} (linha ${i + 1}). Valor mascarado automaticamente.`,
            filePath: file.path,
            lineNumber: i + 1,
            maskedSnippet: maskSecretMatch(captured),
            cweIds: rule.cweIds,
            recommendation: rule.recommendation,
          });
          break;
        }
      }
    }

    return findings;
  }
}
