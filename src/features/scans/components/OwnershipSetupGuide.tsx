'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  Check,
  Copy,
  Globe,
  HelpCircle,
  Laptop,
  Server,
  Terminal,
} from 'lucide-react';
import {
  TargetAuthorization,
  VerificationMethod,
} from '@/core/models/scan.models';
import { SurfaceCard } from './ui/PagePrimitives';

export interface OwnershipSetupGuideProps {
  activeTarget: TargetAuthorization | null;
  method: VerificationMethod;
  onSelectMethod: (method: VerificationMethod) => void;
}

type FileHostingTab = 'ssh' | 'web';

function CopyableCodeBlock({
  label,
  code,
  caption,
}: {
  label: string;
  code: string;
  caption?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard unavailable in restricted environments
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-subtle bg-slate-950 text-slate-100">
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-3.5 py-2">
        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold text-slate-300">
          <Terminal className="h-3.5 w-3.5 text-cyan-400" />
          {label}
        </span>
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] font-medium text-slate-200 transition hover:border-cyan-500/60 hover:text-cyan-300"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-400" />
              <span>Copiado</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copiar</span>
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-3.5 font-mono text-xs leading-relaxed text-cyan-100">
        <code>{code}</code>
      </pre>
      {caption ? (
        <div className="border-t border-slate-800/80 bg-slate-900/50 px-3.5 py-2 text-[11px] leading-relaxed text-slate-400">
          {caption}
        </div>
      ) : null}
    </div>
  );
}

export function OwnershipSetupGuide({
  activeTarget,
  method,
  onSelectMethod,
}: OwnershipSetupGuideProps) {
  const [fileTab, setFileTab] = useState<FileHostingTab>('ssh');

  const origin = activeTarget?.origin ?? 'https://seusite.com.br';
  const hostname = activeTarget?.hostname ?? 'seusite.com.br';
  const token =
    activeTarget?.challengeToken ?? 'brynja-verify-SEU_TOKEN_GERADO_ACIMA';
  const hasRealTarget = Boolean(activeTarget?.challengeToken);

  const wellKnownUrl = `${origin}/.well-known/brynja-verify.txt`;
  const sshConnectCmd = `ssh usuario@${hostname}`;
  const sshCreateFileCmd = `sudo mkdir -p /var/www/html/.well-known && printf '%s\\n' '${token}' | sudo tee /var/www/html/.well-known/brynja-verify.txt > /dev/null`;
  const nginxSnippet = `location ^~ /.well-known/ {
    root /var/www/html;
    default_type text/plain;
    allow all;
}`;
  const nginxReloadCmd = `sudo nginx -t && sudo systemctl reload nginx`;
  const curlVerifyCmd = `curl -fsSL ${wellKnownUrl}`;
  const dnsVerifyCmd = `dig +short TXT _brynja.${hostname}\n# Alternativa (Windows / Linux / macOS):\nnslookup -type=TXT _brynja.${hostname}`;

  return (
    <SurfaceCard
      id="guia-configuracao-posse"
      className="overflow-hidden scroll-mt-20"
    >
      {/* Header */}
      <div className="border-b border-subtle bg-surface-subtle/60 px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-700 dark:text-cyan-300">
              <BookOpen className="h-4 w-4" />
              Guia Passo a Passo de Configuração
            </div>
            <h2 className="mt-1 text-base font-bold text-fg">
              Como comprovar a posse do seu domínio (iniciantes e terminal SSH)
            </h2>
            <p className="mt-0.5 text-xs text-fg-secondary">
              Siga as etapas abaixo para liberar as sondas seguras no seu site.
              {hasRealTarget
                ? ' Os comandos abaixo já estão preenchidos com o domínio e o token do seu alvo.'
                : ' Gere um desafio no formulário acima para preencher automaticamente todos os comandos com o seu token real.'}
            </p>
          </div>

          {hasRealTarget ? (
            <div className="shrink-0 rounded-xl border border-cyan-500/30 bg-cyan-50 px-3 py-2 text-xs dark:bg-cyan-500/10">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-cyan-800 dark:text-cyan-300">
                Comandos prontos para
              </div>
              <div className="font-mono font-semibold text-fg">{origin}</div>
            </div>
          ) : null}
        </div>

        {/* 3-step high-level overview for beginners */}
        <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
          <div className="rounded-xl border border-subtle bg-surface p-3">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-cyan-600 text-[11px] font-bold text-white dark:bg-cyan-500 dark:text-slate-950">
              1
            </span>
            <div className="mt-1.5 text-xs font-semibold text-fg">
              Gere o código (token)
            </div>
            <p className="mt-0.5 text-[11px] leading-relaxed text-fg-secondary">
              Informe a URL do seu site acima, escolha o método e clique em{' '}
              <strong>Gerar Desafio de Posse</strong>.
            </p>
          </div>
          <div className="rounded-xl border border-subtle bg-surface p-3">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-cyan-600 text-[11px] font-bold text-white dark:bg-cyan-500 dark:text-slate-950">
              2
            </span>
            <div className="mt-1.5 text-xs font-semibold text-fg">
              Publique a prova no site ou DNS
            </div>
            <p className="mt-0.5 text-[11px] leading-relaxed text-fg-secondary">
              Escolha a opção abaixo (SSH no terminal, projeto web/cPanel ou
              painel DNS) e cole o token exatamente como foi gerado.
            </p>
          </div>
          <div className="rounded-xl border border-subtle bg-surface p-3">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white dark:bg-emerald-500 dark:text-slate-950">
              3
            </span>
            <div className="mt-1.5 text-xs font-semibold text-fg">
              Clique em Verificar Posse
            </div>
            <p className="mt-0.5 text-[11px] leading-relaxed text-fg-secondary">
              O Brynja lê a prova e emite um certificado de 7 dias (renovado
              automaticamente enquanto o arquivo ou DNS permanecer ativo).
            </p>
          </div>
        </div>

        {/* Method Tabs */}
        <div className="mt-4 flex flex-wrap gap-1.5 rounded-xl border border-subtle bg-surface p-1">
          {(
            [
              {
                id: 'WELL_KNOWN_FILE',
                label: 'Arquivo /.well-known (Recomendado)',
                icon: Server,
              },
              {
                id: 'DNS_TXT',
                label: 'Registro DNS TXT',
                icon: Globe,
              },
              {
                id: 'LOCAL_DEV_SANDBOX',
                label: 'Sandbox Local (dev)',
                icon: Laptop,
              },
            ] as Array<{
              id: VerificationMethod;
              label: string;
              icon: React.ComponentType<{ className?: string }>;
            }>
          ).map((tab) => {
            const Icon = tab.icon;
            const active = method === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectMethod(tab.id)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? 'bg-cyan-600 text-white shadow-sm dark:bg-cyan-500 dark:text-slate-950'
                    : 'text-fg-secondary hover:bg-surface-subtle hover:text-fg'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Method Content */}
      <div className="space-y-5 p-5 sm:p-6">
        {method === 'WELL_KNOWN_FILE' ? (
          <div className="space-y-4">
            {/* Sub-tabs: Remote SSH Terminal vs No-SSH Web Hosting */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs leading-relaxed text-fg-secondary">
                O objetivo é deixar o endereço{' '}
                <code className="rounded bg-surface-subtle px-1.5 py-0.5 font-mono text-[11px] font-semibold text-cyan-700 dark:text-cyan-300">
                  {wellKnownUrl}
                </code>{' '}
                acessível mostrando somente o seu token. Escolha como você
                publica no seu servidor:
              </p>

              <div className="inline-flex rounded-xl border border-subtle bg-surface-subtle p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setFileTab('ssh')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold transition ${
                    fileTab === 'ssh'
                      ? 'bg-surface text-cyan-700 shadow-sm dark:text-cyan-300'
                      : 'text-fg-secondary hover:text-fg'
                  }`}
                >
                  <Terminal className="h-3.5 w-3.5" />
                  Via Terminal Remoto (SSH)
                </button>
                <button
                  type="button"
                  onClick={() => setFileTab('web')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold transition ${
                    fileTab === 'web'
                      ? 'bg-surface text-cyan-700 shadow-sm dark:text-cyan-300'
                      : 'text-fg-secondary hover:text-fg'
                  }`}
                >
                  <Globe className="h-3.5 w-3.5" />
                  Sem SSH (Vercel / Projeto / cPanel)
                </button>
              </div>
            </div>

            {fileTab === 'ssh' ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-fg">
                    Passo 1 — Conectar ao servidor remoto pelo terminal
                  </h3>
                  <p className="text-xs text-fg-secondary">
                    Abra o terminal do seu computador (Linux, macOS ou
                    PowerShell/WSL no Windows) e acesse o servidor via SSH:
                  </p>
                  <CopyableCodeBlock
                    label="Terminal local → SSH"
                    code={sshConnectCmd}
                    caption="Substitua 'usuario' pelo seu usuário do servidor (ex.: root, ubuntu, deploy) ou use o apelido configurado no seu ~/.ssh/config."
                  />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-fg">
                    Passo 2 — Criar a pasta .well-known e gravar o arquivo de
                    verificação
                  </h3>
                  <p className="text-xs text-fg-secondary">
                    Já conectado no servidor remoto, execute o comando abaixo
                    para criar a pasta e salvar o token sem espaços extras:
                  </p>
                  <CopyableCodeBlock
                    label="Servidor remoto (Linux / VPS)"
                    code={sshCreateFileCmd}
                    caption="Se o diretório raiz do seu site não for /var/www/html (ex.: /var/www/meusite/public ou /usr/share/nginx/html), troque o caminho antes de executar."
                  />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-fg">
                    Passo 3 — (Opcional, mas comum) Se você usa Nginx como proxy
                    reverso
                  </h3>
                  <p className="text-xs text-fg-secondary">
                    Se o seu site roda em Node.js, Next.js, Docker ou Python
                    atrás do Nginx (
                    <code className="rounded bg-surface-subtle px-1 py-0.5 font-mono text-[11px]">
                      proxy_pass
                    </code>
                    ), o Nginx pode enviar a rota para a aplicação e devolver
                    404. Adicione este bloco dentro de{' '}
                    <code className="rounded bg-surface-subtle px-1 py-0.5 font-mono text-[11px]">
                      server &#123; ... &#125;
                    </code>{' '}
                    no arquivo do site em{' '}
                    <code className="rounded bg-surface-subtle px-1 py-0.5 font-mono text-[11px]">
                      /etc/nginx/sites-available/
                    </code>
                    :
                  </p>
                  <CopyableCodeBlock
                    label="Trecho Nginx (/etc/nginx/sites-available/...)"
                    code={nginxSnippet}
                  />
                  <CopyableCodeBlock
                    label="Validar sintaxe e recarregar o Nginx sem downtime"
                    code={nginxReloadCmd}
                  />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-fg">
                    Passo 4 — Testar pelo terminal se o arquivo ficou público
                  </h3>
                  <p className="text-xs text-fg-secondary">
                    Rode o comando abaixo (no servidor ou no seu computador).
                    Ele deve imprimir exatamente o seu token na tela:
                  </p>
                  <CopyableCodeBlock
                    label="Teste rápido via curl"
                    code={curlVerifyCmd}
                    caption={`Resultado esperado: ${token}. Se apareceu exatamente isso, suba a página e clique em "Verificar Posse"!`}
                  />
                </div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2.5 rounded-xl border border-subtle bg-surface-subtle/60 p-4">
                  <h3 className="text-xs font-bold text-fg">
                    Opção A — Projeto Web (Next.js, React, Vite, Vercel,
                    Netlify)
                  </h3>
                  <ol className="list-decimal space-y-1.5 pl-4 text-xs leading-relaxed text-fg-secondary">
                    <li>
                      Abra a pasta{' '}
                      <code className="rounded bg-surface px-1 py-0.5 font-mono text-[11px]">
                        public/
                      </code>{' '}
                      na raiz do seu projeto.
                    </li>
                    <li>
                      Crie dentro dela uma subpasta chamada exatamente{' '}
                      <code className="rounded bg-surface px-1 py-0.5 font-mono text-[11px]">
                        .well-known
                      </code>{' '}
                      (com o ponto na frente).
                    </li>
                    <li>
                      Crie o arquivo{' '}
                      <code className="rounded bg-surface px-1 py-0.5 font-mono text-[11px]">
                        public/.well-known/brynja-verify.txt
                      </code>{' '}
                      e cole <strong>somente</strong> o token abaixo dentro
                      dele.
                    </li>
                    <li>
                      Faça o commit/deploy e abra{' '}
                      <code className="break-all rounded bg-surface px-1 py-0.5 font-mono text-[11px]">
                        {wellKnownUrl}
                      </code>{' '}
                      no navegador para conferir.
                    </li>
                  </ol>
                  <CopyableCodeBlock
                    label="Conteúdo exato do arquivo brynja-verify.txt"
                    code={token}
                  />
                </div>

                <div className="space-y-2.5 rounded-xl border border-subtle bg-surface-subtle/60 p-4">
                  <h3 className="text-xs font-bold text-fg">
                    Opção B — Painel de Hospedagem (cPanel, Hostinger, FTP)
                  </h3>
                  <ol className="list-decimal space-y-1.5 pl-4 text-xs leading-relaxed text-fg-secondary">
                    <li>
                      Acesse o <strong>Gerenciador de Arquivos</strong> e entre
                      na pasta pública do site (normalmente{' '}
                      <code className="rounded bg-surface px-1 py-0.5 font-mono text-[11px]">
                        public_html
                      </code>
                      ).
                    </li>
                    <li>
                      Nas configurações do gerenciador, marque a opção{' '}
                      <strong>Mostrar arquivos ocultos (dotfiles)</strong>.
                    </li>
                    <li>
                      Crie a pasta{' '}
                      <code className="rounded bg-surface px-1 py-0.5 font-mono text-[11px]">
                        .well-known
                      </code>{' '}
                      (se ainda não existir) e crie dentro dela o arquivo{' '}
                      <code className="rounded bg-surface px-1 py-0.5 font-mono text-[11px]">
                        brynja-verify.txt
                      </code>
                      .
                    </li>
                    <li>
                      Edite o arquivo, cole apenas o token, salve e clique em{' '}
                      <strong>Verificar Posse</strong> aqui no Brynja.
                    </li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        ) : null}

        {method === 'DNS_TXT' ? (
          <div className="space-y-4">
            <p className="text-xs leading-relaxed text-fg-secondary">
              Ideal se você não tem acesso aos arquivos do servidor web, mas
              controla o painel de DNS do domínio (Cloudflare, Registro.br,
              GoDaddy, Route 53, Vercel DNS). Crie um registro com os valores
              abaixo:
            </p>

            <div className="overflow-x-auto rounded-xl border border-subtle">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-subtle bg-surface-subtle text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
                  <tr>
                    <th className="px-4 py-2.5">Tipo</th>
                    <th className="px-4 py-2.5">Nome / Host</th>
                    <th className="px-4 py-2.5">Valor / Conteúdo</th>
                    <th className="px-4 py-2.5">TTL</th>
                  </tr>
                </thead>
                <tbody className="bg-surface font-mono text-xs text-fg">
                  <tr>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-cyan-700 dark:text-cyan-300">
                      TXT
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      _brynja
                      <span className="block font-sans text-[11px] text-fg-muted">
                        (ou _brynja.{hostname})
                      </span>
                    </td>
                    <td className="break-all px-4 py-3 text-amber-700 dark:text-amber-300">
                      {token}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-fg-secondary">
                      Auto / 300s
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-fg">
                Conferir propagação DNS pelo terminal (opcional)
              </h3>
              <p className="text-xs text-fg-secondary">
                Após salvar no painel DNS (costuma propagar em 1 a 10 minutos),
                você pode testar pelo terminal antes de clicar em{' '}
                <strong>Verificar Posse</strong>:
              </p>
              <CopyableCodeBlock
                label="Terminal (Linux / macOS / Windows)"
                code={dnsVerifyCmd}
                caption={`Quando a saída exibir "${token}", o DNS já propagou e a verificação será aprovada imediatamente.`}
              />
            </div>
          </div>
        ) : null}

        {method === 'LOCAL_DEV_SANDBOX' ? (
          <div className="space-y-4">
            <p className="text-xs leading-relaxed text-fg-secondary">
              Este modo serve apenas para testar uma aplicação rodando
              localmente na sua própria máquina (
              <code className="rounded bg-surface-subtle px-1 py-0.5 font-mono text-[11px]">
                http://localhost:3000
              </code>
              ,{' '}
              <code className="rounded bg-surface-subtle px-1 py-0.5 font-mono text-[11px]">
                http://127.0.0.1:8080
              </code>
              ). Por proteção anti-SSRF, ele permanece bloqueado na versão
              hospedada na Vercel.
            </p>

            <CopyableCodeBlock
              label="No seu .env.local (apenas desenvolvimento local)"
              code={`ALLOW_LOCAL_LOOPBACK_TARGETS=true`}
              caption="Depois de salvar no .env.local, reinicie o servidor local (pnpm dev), gere o desafio para http://localhost:<porta> e clique em Verificar Posse."
            />
          </div>
        ) : null}

        {/* Quick beginner troubleshooting footer */}
        <div className="rounded-xl border border-subtle bg-surface-subtle/60 p-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-fg">
            <HelpCircle className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />
            Dicas rápidas se a verificação falhar
          </div>
          <ul className="mt-2 space-y-1.5 text-xs text-fg-secondary">
            <li>
              • <strong>Retornou página HTML ou 404:</strong> verifique se o
              proxy reverso (Nginx/Cloudflare/Vercel rewrites) não está
              capturando a rota{' '}
              <code className="rounded bg-surface px-1 py-0.5 font-mono text-[11px]">
                /.well-known/
              </code>{' '}
              e devolvendo o index da aplicação.
            </li>
            <li>
              • <strong>Não apague a prova depois de verificar:</strong> manter
              o arquivo ou o registro TXT publicado permite que o Brynja renove
              seu certificado automaticamente após 7 dias sem precisar
              reconfigurar.
            </li>
            <li>
              • <strong>Quer revogar o acesso?</strong> basta apagar o arquivo
              no servidor (ou o registro DNS TXT) e clicar no botão Revogar na
              lista de alvos acima.
            </li>
          </ul>
        </div>
      </div>
    </SurfaceCard>
  );
}
