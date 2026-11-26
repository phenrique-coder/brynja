import { randomUUID } from 'node:crypto';
import {
  RepositoryPostureSignals,
  StaticAnalysisFinding,
} from '../../domain/entities/scan.types';

export class GitHubPostureAnalyzer {
  analyzePosture(
    signals: RepositoryPostureSignals | null,
    repositoryUrl: string,
  ): StaticAnalysisFinding[] {
    if (!signals) return [];
    const findings: StaticAnalysisFinding[] = [];

    if (!signals.hasSecurityMd) {
      findings.push({
        id: randomUUID(),
        ruleId: 'posture:missing-security-md',
        category: 'REPO_POSTURE',
        severity: 'LOW',
        title: 'Arquivo SECURITY.md ausente no repositório',
        description:
          'Sem SECURITY.md na raiz ou em .github/, colaboradores e pesquisadores não encontram política clara para reporte coordenado de falhas.',
        filePath: 'SECURITY.md',
        lineNumber: null,
        maskedSnippet: null,
        cweIds: ['CWE-1059'],
        recommendation:
          'Adicione SECURITY.md com canal de contato, versões suportadas e política de divulgação coordenada (NIST SSDF / CIS 16.2).',
      });
    }

    if (!signals.hasDependabotOrRenovate) {
      findings.push({
        id: randomUUID(),
        ruleId: 'posture:missing-dependency-automation',
        category: 'REPO_POSTURE',
        severity: 'LOW',
        title: 'Automação de atualização de dependências não detectada (Dependabot/Renovate)',
        description:
          'Nenhum arquivo .github/dependabot.yml ou renovate.json encontrado para abrir PRs automáticos de correção de CVEs.',
        filePath: '.github/dependabot.yml',
        lineNumber: null,
        maskedSnippet: null,
        cweIds: ['CWE-1104'],
        recommendation:
          'Configure .github/dependabot.yml (ou Renovate) para manter dependências e GitHub Actions continuamente atualizados (CIS 7.4).',
      });
    }

    if (!signals.hasCodeowners) {
      findings.push({
        id: randomUUID(),
        ruleId: 'posture:missing-codeowners',
        category: 'REPO_POSTURE',
        severity: 'INFO',
        title: 'Arquivo CODEOWNERS ausente para revisão obrigatória em arquivos críticos',
        description:
          'CODEOWNERS ajuda a exigir revisão do time de segurança em alterações de autenticação, workflows e manifestos.',
        filePath: '.github/CODEOWNERS',
        lineNumber: null,
        maskedSnippet: null,
        cweIds: [],
        recommendation:
          'Adicione .github/CODEOWNERS definindo revisores obrigatórios para .github/workflows/, autenticação e manifestos.',
      });
    }

    if (signals.defaultBranchProtected === false) {
      findings.push({
        id: randomUUID(),
        ruleId: 'posture:unprotected-default-branch',
        category: 'REPO_POSTURE',
        severity: 'MEDIUM',
        title: `Branch padrão sem proteção ativa detectada (${repositoryUrl})`,
        description:
          'A branch padrão não possui regra de Branch Protection acessível/ativa para impedir force-push ou merge sem revisão.',
        filePath: 'GitHub Branch Settings',
        lineNumber: null,
        maskedSnippet: null,
        cweIds: ['CWE-284'],
        recommendation:
          'Habilite Branch Protection / Rulesets exigindo Pull Request, revisão aprovada e status checks verdes antes do merge.',
      });
    }

    return findings;
  }
}
