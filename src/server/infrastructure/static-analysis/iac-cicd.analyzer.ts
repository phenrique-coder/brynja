import { randomUUID } from 'node:crypto';
import * as path from 'node:path';
import {
  RepositoryFile,
  StaticAnalysisFinding,
} from '../../domain/entities/scan.types';
import { IStaticAnalyzer } from '../../domain/ports/server.ports';

export class IacCicdAnalyzer implements IStaticAnalyzer {
  readonly id = 'static:iac-cicd';

  supports(filePath: string): boolean {
    const normalized = filePath.toLowerCase();
    const base = path.posix.basename(normalized);
    return (
      base === 'dockerfile' ||
      base.startsWith('dockerfile.') ||
      /^docker-compose(?:\.[^.]+)?\.ya?ml$/.test(base) ||
      normalized.endsWith('.tf') ||
      normalized.includes('.github/workflows/') ||
      base.endsWith('.yaml') ||
      base.endsWith('.yml')
    );
  }

  async analyze(files: RepositoryFile[]): Promise<StaticAnalysisFinding[]> {
    const findings: StaticAnalysisFinding[] = [];

    for (const file of files) {
      if (!this.supports(file.path)) continue;
      const normalized = file.path.toLowerCase();
      const base = path.posix.basename(normalized);

      if (base === 'dockerfile' || base.startsWith('dockerfile.')) {
        findings.push(...this.analyzeDockerfile(file));
      } else if (/^docker-compose(?:\.[^.]+)?\.ya?ml$/.test(base)) {
        findings.push(...this.analyzeDockerCompose(file));
      } else if (normalized.endsWith('.tf')) {
        findings.push(...this.analyzeTerraform(file));
      } else if (
        normalized.includes('.github/workflows/') &&
        (base.endsWith('.yml') || base.endsWith('.yaml'))
      ) {
        findings.push(...this.analyzeGitHubWorkflow(file));
      } else if (
        (base.endsWith('.yml') || base.endsWith('.yaml')) &&
        /^\s*apiVersion\s*:/m.test(file.content) &&
        /^\s*kind\s*:/m.test(file.content)
      ) {
        findings.push(...this.analyzeKubernetes(file));
      }
    }

    return findings;
  }

  private analyzeDockerfile(file: RepositoryFile): StaticAnalysisFinding[] {
    const out: StaticAnalysisFinding[] = [];
    const lines = file.content.split(/\r?\n/);
    let hasNonRootUser = false;

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i].trim();
      if (!line || line.startsWith('#')) continue;

      if (/^FROM\s+\S+:latest\b/i.test(line)) {
        out.push({
          id: randomUUID(),
          ruleId: 'iac:dockerfile-latest-tag',
          category: 'IAC_MISCONFIG',
          severity: 'MEDIUM',
          title: 'Imagem Docker base usando tag mutável ":latest"',
          description:
            'Usar ":latest" em Dockerfile compromete reprodutibilidade e pode introduzir vulnerabilidades sem aviso (CIS Docker Benchmark 4.7).',
          filePath: file.path,
          lineNumber: i + 1,
          maskedSnippet: line.slice(0, 100),
          cweIds: ['CWE-829', 'CWE-1188'],
          recommendation:
            'Fixe a versão exata da imagem base e, idealmente, seu digest SHA256.',
        });
      }

      const userMatch = line.match(/^USER\s+(\S+)/i);
      if (userMatch && userMatch[1] !== 'root' && userMatch[1] !== '0') {
        hasNonRootUser = true;
      } else if (userMatch && (userMatch[1] === 'root' || userMatch[1] === '0')) {
        hasNonRootUser = false;
      }

      if (/\b(?:curl|wget)\b[^|\n]*\|\s*(?:sh|bash)\b/i.test(line)) {
        out.push({
          id: randomUUID(),
          ruleId: 'iac:dockerfile-pipe-to-shell',
          category: 'IAC_MISCONFIG',
          severity: 'HIGH',
          title: 'Execução remota direta via curl/wget | sh em Dockerfile',
          description:
            'Canalizar downloads remotos diretamente para o shell sem verificação de checksum amplia risco de ataque à cadeia de suprimentos.',
          filePath: file.path,
          lineNumber: i + 1,
          maskedSnippet: line.slice(0, 100),
          cweIds: ['CWE-494', 'CWE-829'],
          recommendation:
            'Baixe o artefato, valide seu hash SHA256 antes de instalar ou utilize gerenciador de pacotes assinado.',
        });
      }
    }

    if (!hasNonRootUser) {
      out.push({
        id: randomUUID(),
        ruleId: 'iac:dockerfile-root-user',
        category: 'IAC_MISCONFIG',
        severity: 'MEDIUM',
        title: 'Container Docker executando como root (sem diretiva USER não-root)',
        description:
          'Containers sem USER explícito executam processos como root, violando menor privilégio (CIS Docker Benchmark 4.1).',
        filePath: file.path,
        lineNumber: 1,
        maskedSnippet: 'USER <non-root> ausente',
        cweIds: ['CWE-250'],
        recommendation:
          'Crie um usuário sem privilégios (ex.: USER node ou USER 1001) antes do CMD/ENTRYPOINT.',
      });
    }

    return out;
  }

  private analyzeDockerCompose(file: RepositoryFile): StaticAnalysisFinding[] {
    const out: StaticAnalysisFinding[] = [];
    const lines = file.content.split(/\r?\n/);

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i].trim();
      if (/^privileged\s*:\s*true\b/i.test(line)) {
        out.push({
          id: randomUUID(),
          ruleId: 'iac:compose-privileged',
          category: 'IAC_MISCONFIG',
          severity: 'HIGH',
          title: 'Serviço Docker Compose configurado em modo privileged: true',
          description:
            'Modo privileged concede quase todas as capacidades do kernel do host ao container.',
          filePath: file.path,
          lineNumber: i + 1,
          maskedSnippet: line,
          cweIds: ['CWE-250'],
          recommendation:
            'Remova privileged: true e conceda apenas as capabilities mínimas via cap_add.',
        });
      }
      if (/\/var\/run\/docker\.sock\b/.test(line)) {
        out.push({
          id: randomUUID(),
          ruleId: 'iac:compose-docker-sock',
          category: 'IAC_MISCONFIG',
          severity: 'HIGH',
          title: 'Montagem do socket Docker (/var/run/docker.sock) em container',
          description:
            'Expor docker.sock dentro de um container permite escalonamento trivial para root no host.',
          filePath: file.path,
          lineNumber: i + 1,
          maskedSnippet: line.slice(0, 100),
          cweIds: ['CWE-250'],
          recommendation:
            'Evite montar docker.sock em containers de aplicação; use proxy restrito somente leitura caso estritamente necessário.',
        });
      }
    }

    return out;
  }

  private analyzeTerraform(file: RepositoryFile): StaticAnalysisFinding[] {
    const out: StaticAnalysisFinding[] = [];
    const lines = file.content.split(/\r?\n/);

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i].trim();
      if (line.startsWith('#') || line.startsWith('//')) continue;

      if (/0\.0\.0\.0\/0/.test(line) && /(?:cidr|source_range)/i.test(line)) {
        out.push({
          id: randomUUID(),
          ruleId: 'iac:terraform-open-cidr',
          category: 'IAC_MISCONFIG',
          severity: 'HIGH',
          title: 'Regra de rede Terraform aberta para toda a internet (0.0.0.0/0)',
          description:
            'Blocos CIDR 0.0.0.0/0 em regras de entrada expõem portas administrativas ou serviços internos publicamente.',
          filePath: file.path,
          lineNumber: i + 1,
          maskedSnippet: line.slice(0, 100),
          cweIds: ['CWE-284'],
          recommendation:
            'Restrinja cidr_blocks apenas às faixas corporativas, VPN ou Security Groups internos necessários.',
        });
      }

      if (/(?:acl\s*=\s*["']public-read(?:-write)?["']|(?:storage_)?encrypted\s*=\s*false)/i.test(line)) {
        out.push({
          id: randomUUID(),
          ruleId: 'iac:terraform-storage-exposure',
          category: 'IAC_MISCONFIG',
          severity: 'HIGH',
          title: 'Armazenamento Terraform sem criptografia ou com ACL pública',
          description:
            'Buckets com acesso público ou volumes/bancos com criptografia desativada violam controles básicos CIS e LGPD.',
          filePath: file.path,
          lineNumber: i + 1,
          maskedSnippet: line.slice(0, 100),
          cweIds: ['CWE-311', 'CWE-284'],
          recommendation:
            'Defina criptografia em repouso (encrypted = true) e bloqueie acesso público em buckets.',
        });
      }
    }

    return out;
  }

  private analyzeKubernetes(file: RepositoryFile): StaticAnalysisFinding[] {
    const out: StaticAnalysisFinding[] = [];
    const lines = file.content.split(/\r?\n/);

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i].trim();
      if (
        /^(?:privileged\s*:\s*true|runAsNonRoot\s*:\s*false|allowPrivilegeEscalation\s*:\s*true)\b/.test(
          line,
        )
      ) {
        out.push({
          id: randomUUID(),
          ruleId: 'iac:k8s-insecure-security-context',
          category: 'IAC_MISCONFIG',
          severity: 'HIGH',
          title: `SecurityContext permissivo em manifesto Kubernetes (${line})`,
          description:
            'Configurações privilegiadas em Pods permitem escalonamento de privilégios no cluster (CIS Kubernetes Benchmark).',
          filePath: file.path,
          lineNumber: i + 1,
          maskedSnippet: line,
          cweIds: ['CWE-250'],
          recommendation:
            'Defina runAsNonRoot: true, allowPrivilegeEscalation: false e privileged: false.',
        });
      }
    }

    return out;
  }

  private analyzeGitHubWorkflow(file: RepositoryFile): StaticAnalysisFinding[] {
    const out: StaticAnalysisFinding[] = [];
    const lines = file.content.split(/\r?\n/);

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i].trim();
      if (line.startsWith('#')) continue;

      if (/\bpull_request_target\b/.test(line)) {
        out.push({
          id: randomUUID(),
          ruleId: 'cicd:gha-pull-request-target',
          category: 'CI_CD_RISK',
          severity: 'HIGH',
          title: 'Workflow GitHub Actions usa trigger "pull_request_target"',
          description:
            'pull_request_target executa com token privilegiado e acesso a secrets mesmo em PRs de forks caso faça checkout do código do PR.',
          filePath: file.path,
          lineNumber: i + 1,
          maskedSnippet: line.slice(0, 100),
          cweIds: ['CWE-284'],
          recommendation:
            'Prefira "pull_request" ou garanta que nenhum código não confiável do PR seja executado no workflow privilegiado.',
        });
      }

      if (/permissions\s*:\s*write-all\b/i.test(line)) {
        out.push({
          id: randomUUID(),
          ruleId: 'cicd:gha-write-all',
          category: 'CI_CD_RISK',
          severity: 'HIGH',
          title: 'Permissão excessiva "write-all" no GITHUB_TOKEN',
          description:
            'Conceder write-all viola o princípio do menor privilégio em pipelines CI/CD (CIS Software Supply Chain).',
          filePath: file.path,
          lineNumber: i + 1,
          maskedSnippet: line,
          cweIds: ['CWE-250'],
          recommendation:
            'Defina permissions granulares somente leitura (contents: read) no topo do workflow.',
        });
      }

      if (
        /\$\{\{\s*github\.event\.(?:issue\.title|issue\.body|pull_request\.title|pull_request\.body|comment\.body|head_commit\.message)\s*\}\}/.test(
          line,
        )
      ) {
        out.push({
          id: randomUUID(),
          ruleId: 'cicd:gha-script-injection',
          category: 'CI_CD_RISK',
          severity: 'CRITICAL',
          title: 'Injeção de script em GitHub Actions via expressão ${{ github.event.* }}',
          description:
            'Interpolar campos controlados por terceiros diretamente em comandos shell permite execução arbitrária de código no runner.',
          filePath: file.path,
          lineNumber: i + 1,
          maskedSnippet: line.slice(0, 100),
          cweIds: ['CWE-78', 'CWE-94'],
          recommendation:
            'Passe o valor por uma variável de ambiente em env: e cite "$VAR" no shell em vez de interpolar ${{ ... }} inline.',
        });
      }

      const usesMatch = line.match(
        /^-\s*uses\s*:\s*([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\/[^@\s]+)?)@([^\s#]+)/,
      );
      if (usesMatch && !/^[0-9a-f]{40}$/i.test(usesMatch[2])) {
        const owner = usesMatch[1].split('/')[0].toLowerCase();
        if (owner !== 'actions' && owner !== 'github') {
          out.push({
            id: randomUUID(),
            ruleId: 'cicd:gha-unpinned-third-party-action',
            category: 'CI_CD_RISK',
            severity: 'LOW',
            title: `Action de terceiro não fixada por SHA imutável (${usesMatch[1]}@${usesMatch[2]})`,
            description:
              'Tags mutáveis (v1, main) em Actions de terceiros podem ser redirecionadas em caso de comprometimento do repositório upstream.',
            filePath: file.path,
            lineNumber: i + 1,
            maskedSnippet: line.slice(0, 100),
            cweIds: ['CWE-829'],
            recommendation:
              'Fixe Actions de terceiros usando o hash SHA completo de 40 caracteres do commit auditado.',
          });
        }
      }
    }

    return out;
  }
}
