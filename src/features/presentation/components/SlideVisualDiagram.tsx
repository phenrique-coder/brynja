'use client';

import React from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Ban,
  Bot,
  CheckCircle2,
  ClipboardCheck,
  CloudOff,
  Code2,
  Cpu,
  Database,
  FileSpreadsheet,
  FileText,
  Gauge,
  GitBranch,
  Github,
  Globe,
  History,
  KeyRound,
  Laptop,
  Layers,
  Lock,
  Radar,
  Scale,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Terminal,
  Upload,
  Users,
} from 'lucide-react';
import { BrynjaLogo } from '@/features/scans/components/BrynjaLogo';
import type { SlideVisualKind } from '../models/presentation.models';

export interface SlideVisualDiagramProps {
  visual: SlideVisualKind;
  appVersion: string;
  showTechnicalDetails: boolean;
  compact?: boolean;
}

export function SlideVisualDiagram({
  visual,
  appVersion,
  showTechnicalDetails,
  compact = false,
}: SlideVisualDiagramProps) {
  const wrap = (content: React.ReactNode) =>
    compact ? (
      <div className="presentation-diagram-compact">{content}</div>
    ) : (
      content
    );

  const diagram = (() => {
    switch (visual) {
      case 'hero-cover':
        return null;
      case 'cover':
      return (
        <div className="relative overflow-hidden rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-cyan-500/10 via-surface-subtle to-indigo-500/10 p-5 sm:p-6">
          <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left print:flex-row print:text-left">
            <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl border border-cyan-500/30 bg-surface shadow-lg shadow-cyan-950/15">
              <BrynjaLogo className="h-16 w-16 drop-shadow-sm" />
            </div>
            <div className="space-y-3">
              <div className="inline-flex flex-wrap items-center justify-center gap-2 sm:justify-start print:justify-start">
                <span className="rounded-full border border-cyan-500/30 bg-cyan-500/15 px-3 py-0.5 font-mono text-xs font-semibold text-cyan-800 dark:text-cyan-200">
                  v{appVersion}
                </span>
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-0.5 text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                  Local-First · Zero Banco na Nuvem
                </span>
                <span className="rounded-full border border-indigo-500/30 bg-indigo-500/15 px-3 py-0.5 text-xs font-semibold text-indigo-800 dark:text-indigo-200">
                  Uso 100% Defensivo
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 print:grid-cols-4">
                {[
                  { value: '8', label: 'Ecossistemas SCA' },
                  { value: '19', label: 'Safe Probes' },
                  { value: '4', label: 'Frameworks GRC' },
                  { value: 'R$ 0', label: 'Custo de Banco' },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-subtle bg-surface/90 px-3 py-2 text-center"
                  >
                    <div className="text-lg font-bold tracking-tight text-cyan-700 dark:text-cyan-300">
                      {stat.value}
                    </div>
                    <div className="text-[11px] font-medium text-fg-secondary">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );

    case 'problem':
      return (
        <div className="grid gap-3 sm:grid-cols-3 print:grid-cols-3">
          {[
            {
              icon: AlertTriangle,
              color:
                'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300',
              stat: '+80%',
              title: 'Código de Terceiros',
              desc: 'Sistemas modernos dependem de dezenas ou centenas de bibliotecas externas invisíveis sem inventário.',
            },
            {
              icon: CloudOff,
              color:
                'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300',
              stat: 'Alto Custo',
              title: 'Licenças & Exposição',
              desc: 'Ferramentas SaaS tradicionais cobram caro por usuário e armazenam vulnerabilidades da empresa fora de casa.',
            },
            {
              icon: Users,
              color:
                'border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300',
              stat: 'Ruído',
              title: 'Fosso TI ↔ Diretoria',
              desc: 'Listas técnicas extensas sem prioridade de negócio dificultam aprovar correções e responder auditorias.',
            },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="flex flex-col justify-between rounded-2xl border border-subtle bg-surface-subtle p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border ${card.color}`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="rounded-lg bg-surface px-2.5 py-1 text-xs font-bold text-fg">
                    {card.stat}
                  </span>
                </div>
                <div className="mt-3">
                  <div className="text-sm font-bold text-fg">{card.title}</div>
                  <p className="mt-1 text-xs leading-relaxed text-fg-secondary">
                    {card.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      );

    case 'chainmail':
      return (
        <div className="grid gap-3 sm:grid-cols-4 print:grid-cols-4">
          {[
            {
              ring: 'Anel 01',
              title: 'Peças & CVEs',
              subtitle: 'SCA / SBOM + 5 Bases',
              icon: Layers,
              accent: 'border-cyan-500/35 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
            },
            {
              ring: 'Anel 02',
              title: 'Código & Nuvem',
              subtitle: 'Segredos, IaC & SAST',
              icon: Code2,
              accent: 'border-amber-500/35 bg-amber-500/10 text-amber-800 dark:text-amber-300',
            },
            {
              ring: 'Anel 03',
              title: 'Site no Ar',
              subtitle: '19 Safe Probes GET/HEAD',
              icon: Radar,
              accent: 'border-violet-500/35 bg-violet-500/10 text-violet-700 dark:text-violet-300',
            },
            {
              ring: 'Anel 04',
              title: 'Decisão & GRC',
              subtitle: 'PDF, IA BYOK & LGPD',
              icon: ClipboardCheck,
              accent: 'border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
            },
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.ring}
                className="relative flex flex-col rounded-2xl border border-subtle bg-surface-subtle p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
                    {item.ring}
                  </span>
                  <span
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-xl border ${item.accent}`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <div className="mt-3 text-sm font-bold text-fg">
                  {item.title}
                </div>
                <div className="mt-1 text-xs text-fg-secondary">
                  {item.subtitle}
                </div>
                {index < 3 ? (
                  <ArrowRight className="pointer-events-none absolute -right-2.5 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-fg-muted sm:block" />
                ) : null}
              </div>
            );
          })}
        </div>
      );

    case 'local-first':
      return (
        <div className="grid gap-3 md:grid-cols-3 print:grid-cols-3">
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
              <Laptop className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider">
                1. Seu Navegador
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-fg-secondary">
              Guarda localmente o histórico, SBOMs, autorizações e avaliações
              GRC — isolados pela sua conta GitHub.
            </p>
            {showTechnicalDetails ? (
              <div className="mt-2 font-mono text-[11px] text-emerald-700 dark:text-emerald-300">
                IndexedDB · ownerGithubUserId
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-4">
            <div className="flex items-center gap-2 text-cyan-700 dark:text-cyan-300">
              <Cpu className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider">
                2. Motor Stateless (Vercel)
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-fg-secondary">
              Processa a análise sob demanda na memória, devolve o resultado e
              descarta tudo imediatamente.
            </p>
            {showTechnicalDetails ? (
              <div className="mt-2 font-mono text-[11px] text-cyan-700 dark:text-cyan-300">
                Cookie HttpOnly AES-256-GCM
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300">
              <Database className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider">
                3. Banco na Nuvem
              </span>
            </div>
            <p className="mt-2 text-xs font-semibold text-rose-700 dark:text-rose-300">
              NÃO EXISTE (Zero armazenamento externo)
            </p>
            <p className="mt-1 text-xs leading-relaxed text-fg-secondary">
              Sem custo de banco, sem retenção de tokens e sem risco de
              vazamento centralizado de vulnerabilidades.
            </p>
          </div>
        </div>
      );

    case 'journey-map':
      return (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-7 print:grid-cols-7">
          {[
            { n: '01', title: 'Login GitHub', icon: Github },
            { n: '02', title: 'Autorizar Domínio', icon: Lock },
            { n: '03', title: 'Configurar Scan', icon: Layers },
            { n: '04', title: '4 Camadas', icon: ShieldCheck },
            { n: '05', title: 'Relatórios', icon: FileText },
            { n: '06', title: 'Governança GRC', icon: ClipboardCheck },
            { n: '07', title: 'Diff & Auditoria', icon: History },
          ].map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.n}
                className="flex flex-col items-center rounded-2xl border border-subtle bg-surface-subtle p-3 text-center"
              >
                <span className="font-mono text-[10px] font-bold text-cyan-700 dark:text-cyan-300">
                  ETAPA {step.n}
                </span>
                <span className="mt-2 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-500/25 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="mt-2 text-xs font-bold leading-tight text-fg">
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      );

    case 'stage-auth':
      return (
        <div className="grid gap-3 sm:grid-cols-3 print:grid-cols-3">
          {[
            {
              icon: Github,
              title: '1. Entrar com GitHub',
              desc: 'Usa a conta já existente do colaborador — respeitando repos privados e Organizações.',
              badge: 'Sem senha extra',
            },
            {
              icon: KeyRound,
              title: '2. Sessão Criptografada',
              desc: 'Token temporário selado na sessão do navegador. Fechou ou saiu, o acesso se encerra.',
              badge: 'Efêmera',
            },
            {
              icon: Users,
              title: '3. Espaço Isolado',
              desc: 'Cada conta enxerga apenas seu histórico e autorizações, mesmo em computadores compartilhados.',
              badge: 'Multi-usuário',
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="rounded-2xl border border-subtle bg-surface-subtle p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-500/25 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="rounded-full bg-surface px-2.5 py-0.5 text-[11px] font-semibold text-fg-secondary">
                    {item.badge}
                  </span>
                </div>
                <div className="mt-3 text-sm font-bold text-fg">
                  {item.title}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-fg-secondary">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      );

    case 'stage-authz':
      return (
        <div className="grid gap-3 sm:grid-cols-4 print:grid-cols-4">
          {[
            {
              step: 'Passo 1',
              title: 'Informar URL',
              desc: 'Ex.: staging.empresa.com.br',
              icon: Globe,
            },
            {
              step: 'Passo 2',
              title: 'Publicar Prova',
              desc: 'security.txt (RFC 9116) ou DNS TXT _brynja',
              icon: Terminal,
            },
            {
              step: 'Passo 3',
              title: 'Validar Posse',
              desc: 'Brynja confere o código único no servidor',
              icon: CheckCircle2,
            },
            {
              step: 'Passo 4',
              title: 'Certificado 7 Dias',
              desc: 'Renova ao vivo ou bloqueia se a prova sair',
              icon: Lock,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-3.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                    {item.step}
                  </span>
                  <Icon className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
                </div>
                <div className="mt-2 text-sm font-bold text-fg">
                  {item.title}
                </div>
                <p className="mt-1 text-xs text-fg-secondary">{item.desc}</p>
              </div>
            );
          })}
        </div>
      );

    case 'stage-new-scan':
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 print:grid-cols-4">
            {[
              { eco: 'Node.js / JS / TS', files: 'package.json, pnpm, yarn' },
              { eco: 'Python', files: 'requirements.txt, pyproject' },
              { eco: 'Java / Kotlin', files: 'pom.xml, gradle.lockfile' },
              { eco: '.NET (C#)', files: '*.csproj, packages.lock' },
              { eco: 'Go', files: 'go.mod, go.sum' },
              { eco: 'Rust', files: 'Cargo.toml, Cargo.lock' },
              { eco: 'PHP', files: 'composer.json / .lock' },
              { eco: 'Ruby', files: 'Gemfile.lock' },
            ].map((item) => (
              <div
                key={item.eco}
                className="rounded-xl border border-subtle bg-surface-subtle px-3 py-2.5"
              >
                <div className="text-xs font-bold text-fg">{item.eco}</div>
                <div className="mt-0.5 truncate font-mono text-[10px] text-fg-muted">
                  {item.files}
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-cyan-500/25 bg-cyan-500/5 px-3.5 py-2 text-xs text-fg-secondary">
            <span className="font-semibold text-cyan-800 dark:text-cyan-200">
              + Camadas válidas para qualquer stack:
            </span>
            <span>
              Docker · Terraform · Kubernetes · GitHub Actions · Segredos · 19
              Safe Probes · Import SARIF/Trivy/Semgrep/Prowler
            </span>
          </div>
        </div>
      );

    case 'layer-sca':
      return (
        <div className="grid gap-2.5 sm:grid-cols-5 print:grid-cols-5">
          {[
            {
              name: 'OSV.dev',
              role: 'Identifica falhas por versão exata e qual versão corrige',
              tone: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-800 dark:text-cyan-200',
            },
            {
              name: 'NVD (NIST)',
              role: 'Nota oficial de gravidade (CVSS) e categoria da fraqueza',
              tone: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-800 dark:text-indigo-200',
            },
            {
              name: 'FIRST EPSS',
              role: 'Probabilidade estatística real de ataque nos próximos 30 dias',
              tone: 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200',
            },
            {
              name: 'CISA KEV',
              role: 'Alerta vermelho: já está sendo explorada por criminosos hoje',
              tone: 'border-rose-500/35 bg-rose-500/10 text-rose-800 dark:text-rose-200',
            },
            {
              name: 'deps.dev',
              role: 'Licença jurídica (SPDX) e nota de saúde OpenSSF Scorecard',
              tone: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200',
            },
          ].map((src) => (
            <div
              key={src.name}
              className="flex flex-col rounded-2xl border border-subtle bg-surface-subtle p-3.5"
            >
              <span
                className={`inline-flex w-fit rounded-lg border px-2 py-0.5 text-xs font-bold ${src.tone}`}
              >
                {src.name}
              </span>
              <p className="mt-2.5 text-xs leading-relaxed text-fg-secondary">
                {src.role}
              </p>
            </div>
          ))}
        </div>
      );

    case 'layer-static':
      return (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4">
          {[
            {
              icon: KeyRound,
              title: 'Segredos Vazados',
              items: 'Chaves AWS, GitHub, Stripe, senhas de BD e .env',
              note: 'Sempre mascarado',
              tone: 'text-rose-700 dark:text-rose-300',
            },
            {
              icon: Server,
              title: 'Infra & CI/CD (IaC)',
              items: 'Dockerfile, Compose, Terraform, K8s e GitHub Actions',
              note: 'CIS Benchmark',
              tone: 'text-amber-700 dark:text-amber-300',
            },
            {
              icon: Code2,
              title: 'SAST Leve',
              items: 'SQL concatenado, shell interpolado, eval, TLS desligado',
              note: 'JS/TS & Python',
              tone: 'text-cyan-700 dark:text-cyan-300',
            },
            {
              icon: GitBranch,
              title: 'Postura do Repo',
              items: 'SECURITY.md, Dependabot/Renovate, CODEOWNERS e branch',
              note: 'Higiene contínua',
              tone: 'text-emerald-700 dark:text-emerald-300',
            },
          ].map((box) => {
            const Icon = box.icon;
            return (
              <div
                key={box.title}
                className="rounded-2xl border border-subtle bg-surface-subtle p-4"
              >
                <div className="flex items-center justify-between">
                  <Icon className={`h-5 w-5 ${box.tone}`} />
                  <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-semibold text-fg-muted">
                    {box.note}
                  </span>
                </div>
                <div className="mt-2.5 text-sm font-bold text-fg">
                  {box.title}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-fg-secondary">
                  {box.items}
                </p>
              </div>
            );
          })}
        </div>
      );

    case 'layer-probes':
      return (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4">
          {[
            {
              count: '5 Sondas',
              title: 'Cabeçalhos, TLS & DNS',
              examples:
                'Security Headers · HSTS · CSP & Permissions · COOP/CORP/COEP · SPF/DMARC/CAA',
              accent: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-800 dark:text-cyan-200',
            },
            {
              count: '4 Sondas',
              title: 'Cookies, CORS & Cache',
              examples:
                'HttpOnly/Secure/SameSite · Política CORS · Cache de Sessão · Open Redirect',
              accent: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-800 dark:text-indigo-200',
            },
            {
              count: '5 Sondas',
              title: 'Exposição Indevida',
              examples:
                '.git / .env · Backups / phpinfo · Swagger & Métricas · Robots/Sitemap · OAuth/GraphQL',
              accent: 'border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-200',
            },
            {
              count: '5 Sondas',
              title: 'Runtime & Integridade',
              examples:
                'Fingerprint ↔ SBOM · Source Maps · Stack Traces/Debug · SRI em CDNs · security.txt',
              accent: 'border-violet-500/30 bg-violet-500/10 text-violet-800 dark:text-violet-200',
            },
          ].map((cat) => (
            <div
              key={cat.title}
              className="rounded-2xl border border-subtle bg-surface-subtle p-4"
            >
              <span
                className={`inline-flex rounded-lg border px-2 py-0.5 text-[11px] font-bold ${cat.accent}`}
              >
                {cat.count}
              </span>
              <div className="mt-2.5 text-sm font-bold text-fg">
                {cat.title}
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-fg-secondary">
                {cat.examples}
              </p>
            </div>
          ))}
        </div>
      );

    case 'guardrails':
      return (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4">
          {[
            {
              icon: Lock,
              title: 'Posse Obrigatória',
              value: '100% Verificado',
              desc: 'Nenhuma sonda roda sem certificado criptográfico válido do dono.',
            },
            {
              icon: Ban,
              title: 'Zero Escrita / Ataque',
              value: 'Só GET & HEAD',
              desc: 'Sem POST/DELETE, sem força bruta e sem payloads destrutivos.',
            },
            {
              icon: ShieldAlert,
              title: 'Escudo Anti-SSRF',
              value: 'Rede Bloqueada',
              desc: 'DNS prévio impede acessar IPs internos ou metadados de nuvem.',
            },
            {
              icon: Gauge,
              title: 'Freio & Disjuntor',
              value: '2 req/s · Máx 80',
              desc: 'Aborta automaticamente ao detectar 429 ou erros 5xx no servidor.',
            },
          ].map((g) => {
            const Icon = g.icon;
            return (
              <div
                key={g.title}
                className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4"
              >
                <div className="flex items-center justify-between">
                  <Icon className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
                  <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-800 dark:text-emerald-200">
                    {g.value}
                  </span>
                </div>
                <div className="mt-2.5 text-sm font-bold text-fg">
                  {g.title}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-fg-secondary">
                  {g.desc}
                </p>
              </div>
            );
          })}
        </div>
      );

    case 'layer-ai':
      return (
        <div className="grid gap-3 md:grid-cols-3 print:grid-cols-3">
          <div className="rounded-2xl border border-subtle bg-surface-subtle p-4">
            <div className="flex items-center gap-2 text-cyan-700 dark:text-cyan-300">
              <KeyRound className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Chave da Empresa (BYOK)
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-fg-secondary">
              OpenAI, Google Gemini ou endpoint interno compatível. A chave fica
              apenas no navegador — com descoberta automática de modelos.
            </p>
          </div>
          <div className="rounded-2xl border border-subtle bg-surface-subtle p-4">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
              <Shield className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Filtro de Privacidade
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-fg-secondary">
              Envia somente nomes de vulnerabilidades sanitizados e indícios de
              uso real (reachability). Nenhum segredo ou código completo sai.
            </p>
          </div>
          <div className="rounded-2xl border border-subtle bg-surface-subtle p-4">
            <div className="flex items-center gap-2 text-violet-700 dark:text-violet-300">
              <Bot className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Saída Acionável
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-fg-secondary">
              Resumo executivo pronto para a Diretoria + passos numerados de
              correção para a TI, salvos junto ao PDF Executivo.
            </p>
          </div>
        </div>
      );

    case 'stage-reports':
      return (
        <div className="grid gap-3 md:grid-cols-3 print:grid-cols-3">
          {[
            {
              audience: 'Diretoria & Gerência',
              format: 'PDF Executivo',
              icon: FileText,
              accent:
                'border-cyan-500/35 bg-cyan-500/10 text-cyan-800 dark:text-cyan-200',
              bullets: [
                'Parecer Executivo com SLA (P0 a P3)',
                'Impacto de negócio em linguagem clara',
                'Matriz de Conformidade + Diagnóstico IA',
              ],
            },
            {
              audience: 'Equipe de TI & Devs',
              format: 'JSON para IA + Abas',
              icon: Sparkles,
              accent:
                'border-violet-500/35 bg-violet-500/10 text-violet-800 dark:text-violet-200',
              bullets: [
                'Comandos exatos de atualização por pacote',
                'JSON enxuto pronto para colar no copiloto',
                'Selo "Escudo Íntegro" quando 100% limpo',
              ],
            },
            {
              audience: 'Clientes & Auditoria',
              format: 'SBOM & Padrões',
              icon: Scale,
              accent:
                'border-emerald-500/35 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200',
              bullets: [
                'SBOM CycloneDX 1.5 e SPDX 2.3',
                'SARIF 2.1.0 para pipelines/GitHub',
                'Markdown e JSON técnico completo',
              ],
            },
          ].map((col) => {
            const Icon = col.icon;
            return (
              <div
                key={col.audience}
                className="rounded-2xl border border-subtle bg-surface-subtle p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold ${col.accent}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {col.format}
                  </span>
                </div>
                <div className="mt-2.5 text-sm font-bold text-fg">
                  {col.audience}
                </div>
                <ul className="mt-2 space-y-1.5 text-xs text-fg-secondary">
                  {col.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-1.5">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      );

    case 'stage-governance':
      return (
        <div className="space-y-3">
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4">
            {[
              {
                fw: 'CIS Controls v8',
                scope: 'Grupos IG1 (essencial), IG2 e IG3',
                tone: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-800 dark:text-cyan-200',
              },
              {
                fw: 'NIST CSF 2.0',
                scope: 'Govern, Identify, Protect, Detect, Respond',
                tone: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-800 dark:text-indigo-200',
              },
              {
                fw: 'OWASP ASVS / Top 10',
                scope: 'Controles práticos de segurança web',
                tone: 'border-violet-500/30 bg-violet-500/10 text-violet-800 dark:text-violet-200',
              },
              {
                fw: 'LGPD & ISO 27001',
                scope: 'Arts. 46, 48, 50 e controles Anexo A',
                tone: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200',
              },
            ].map((item) => (
              <div
                key={item.fw}
                className="rounded-2xl border border-subtle bg-surface-subtle p-3.5"
              >
                <span
                  className={`inline-flex rounded-lg border px-2 py-0.5 text-xs font-bold ${item.tone}`}
                >
                  {item.fw}
                </span>
                <p className="mt-2 text-xs text-fg-secondary">{item.scope}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-4 py-2.5 text-xs">
            <span className="inline-flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-200">
              <FileSpreadsheet className="h-4 w-4" />
              Exportação nativa em Excel (.xlsx) com 5 abas prontas para
              auditoria
            </span>
            <span className="text-fg-secondary">
              + JSON de Lacunas para IA + Guia educativo integrado
            </span>
          </div>
        </div>
      );

    case 'stage-history-audit':
      return (
        <div className="grid gap-3 md:grid-cols-3 print:grid-cols-3">
          {[
            {
              icon: Activity,
              title: 'Comparador (Scan Diff)',
              desc: 'Mostra lado a lado o que foi resolvido, o que é novo e quanto a aderência CIS/NIST subiu entre duas datas.',
              badge: 'Evolução Comprovada',
            },
            {
              icon: Upload,
              title: 'Importador Externo',
              desc: 'Centraliza arquivos JSON de Trivy, Semgrep, Prowler e SARIF 2.1.0 no mesmo histórico + Backup local.',
              badge: 'Hub Único',
            },
            {
              icon: ShieldCheck,
              title: 'Trilha de Auditoria (/audit)',
              desc: 'Log de cada requisição HTTP das sondas com data/hora, caminho, status e certificado utilizado.',
              badge: '100% Rastreável',
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="rounded-2xl border border-subtle bg-surface-subtle p-4"
              >
                <div className="flex items-center justify-between">
                  <Icon className="h-5 w-5 text-cyan-700 dark:text-cyan-300" />
                  <span className="rounded-full bg-surface px-2.5 py-0.5 text-[10px] font-bold text-fg-secondary">
                    {item.badge}
                  </span>
                </div>
                <div className="mt-2.5 text-sm font-bold text-fg">
                  {item.title}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-fg-secondary">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      );

    case 'daily-routine':
      return (
        <div className="grid gap-3 md:grid-cols-2 print:grid-cols-2">
          <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-cyan-800 dark:text-cyan-200">
              <Terminal className="h-4 w-4" />
              Cadência da Equipe de TI
            </div>
            <div className="mt-3 space-y-2 text-xs text-fg-secondary">
              <div className="flex items-start gap-2">
                <span className="rounded bg-cyan-500/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-cyan-800 dark:text-cyan-200">
                  Dia 1
                </span>
                <span>Autorizar staging e rodar linha de base do projeto.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="rounded bg-cyan-500/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-cyan-800 dark:text-cyan-200">
                  Semanal
                </span>
                <span>
                  Rodar varredura pré-release, conferir Scan Diff e corrigir
                  itens P0/P1.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="rounded bg-cyan-500/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-cyan-800 dark:text-cyan-200">
                  Mensal
                </span>
                <span>
                  Revisar postura de repositórios e atualizar atestados GRC.
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-800 dark:text-emerald-200">
              <ClipboardCheck className="h-4 w-4" />
              Cadência da Diretoria & Compliance
            </div>
            <div className="mt-3 space-y-2 text-xs text-fg-secondary">
              <div className="flex items-start gap-2">
                <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-800 dark:text-emerald-200">
                  Mensal
                </span>
                <span>
                  Ler PDF Executivo (5 min): verificar pendências P0/P1 e riscos
                  de negócio.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-800 dark:text-emerald-200">
                  Trimestral
                </span>
                <span>
                  Revisar planilha Excel GRC (CIS v8 / LGPD / ISO 27001) e
                  evolução de aderência.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-800 dark:text-emerald-200">
                  Sob Demanda
                </span>
                <span>
                  Entregar SBOM e evidências de conformidade em auditorias ou
                  contratos B2B.
                </span>
              </div>
            </div>
          </div>
        </div>
      );

    case 'pilot-roadmap':
      return (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4">
          {[
            {
              week: 'Semana 1',
              title: 'Setup & Piloto',
              desc: 'Deploy na Vercel, autorização de 2–3 sistemas de homologação e 1ª varredura.',
            },
            {
              week: 'Semana 2',
              title: 'Quick Wins P0/P1',
              desc: 'TI aplica correções prioritárias (bibliotecas, cabeçalhos, segredos/IaC).',
            },
            {
              week: 'Semana 3',
              title: 'Linha de Base GRC',
              desc: 'Primeira matriz CIS v8 (IG1) + LGPD/ISO 27001 em Excel para gestão.',
            },
            {
              week: 'Semana 4',
              title: 'Antes × Depois',
              desc: 'Revisão executiva com Scan Diff para aprovar escala para toda a TI.',
            },
          ].map((item, idx) => (
            <div
              key={item.week}
              className={`rounded-2xl border p-4 ${
                idx === 3
                  ? 'border-emerald-500/35 bg-emerald-500/10'
                  : 'border-subtle bg-surface-subtle'
              }`}
            >
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-300">
                {item.week}
              </span>
              <div className="mt-1.5 text-sm font-bold text-fg">
                {item.title}
              </div>
              <p className="mt-1 text-xs leading-relaxed text-fg-secondary">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      );
    }
  })();

  return wrap(diagram);
}
