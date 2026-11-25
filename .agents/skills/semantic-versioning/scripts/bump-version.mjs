#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const scaffold = args.includes('--scaffold');
const checkOnly = args.includes('--check');
const level = args.find((a) => !a.startsWith('--'));

const cwd = process.cwd();
const pkgPath = resolve(cwd, 'package.json');
const enChangelogPath = resolve(cwd, 'CHANGELOG.md');
const ptChangelogPath = resolve(cwd, 'docs/pt-BR/CHANGELOG.md');

const rawPkg = readFileSync(pkgPath, 'utf8');
const pkg = JSON.parse(rawPkg);
const currentVersion = String(pkg.version ?? '').trim();

function hasVersionEntry(filePath, version) {
  if (!existsSync(filePath)) return false;
  const content = readFileSync(filePath, 'utf8');
  const escaped = version.replace(/\./g, '\\.');
  return new RegExp(`^##\\s+\\[${escaped}\\]`, 'm').test(content);
}

if (checkOnly) {
  const enOk = hasVersionEntry(enChangelogPath, currentVersion);
  const ptOk = hasVersionEntry(ptChangelogPath, currentVersion);

  if (!enOk || !ptOk) {
    if (!enOk) {
      console.error(`ERRO: versão [${currentVersion}] não encontrada em CHANGELOG.md`);
    }
    if (!ptOk) {
      console.error(
        `ERRO: versão [${currentVersion}] não encontrada em docs/pt-BR/CHANGELOG.md`,
      );
    }
    process.exit(1);
  }

  console.log(
    `OK: versão v${currentVersion} sincronizada em package.json, CHANGELOG.md e docs/pt-BR/CHANGELOG.md.`,
  );
  process.exit(0);
}

if (!level || !['major', 'minor', 'patch'].includes(level)) {
  console.error(
    'Uso:\n' +
      '  node .agents/skills/semantic-versioning/scripts/bump-version.mjs <major|minor|patch> [--scaffold] [--dry-run]\n' +
      '  node .agents/skills/semantic-versioning/scripts/bump-version.mjs --check',
  );
  process.exit(1);
}

const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(currentVersion);
if (!match) {
  console.error(
    `Versão inválida em package.json: "${currentVersion}" (esperado X.Y.Z)`,
  );
  process.exit(1);
}

let [major, minor, patch] = match.slice(1).map(Number);

if (level === 'major') {
  major += 1;
  minor = 0;
  patch = 0;
} else if (level === 'minor') {
  minor += 1;
  patch = 0;
} else {
  patch += 1;
}

const nextVersion = `${major}.${minor}.${patch}`;
const updatedPkg = rawPkg.replace(
  /("version"\s*:\s*")(\d+\.\d+\.\d+)(")/,
  `$1${nextVersion}$3`,
);

if (updatedPkg === rawPkg) {
  console.error('Não foi possível atualizar o campo "version" em package.json.');
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);

function insertReleaseScaffold(filePath, sectionHeading) {
  if (!existsSync(filePath) || hasVersionEntry(filePath, nextVersion)) return false;
  const content = readFileSync(filePath, 'utf8');
  const block = `## [${nextVersion}] - ${today}\n\n### ${sectionHeading}\n- ...\n\n`;
  const firstReleaseIdx = content.search(/^##\s+\[/m);
  const nextContent =
    firstReleaseIdx >= 0
      ? `${content.slice(0, firstReleaseIdx)}${block}${content.slice(firstReleaseIdx)}`
      : `${content.trimEnd()}\n\n${block}`;
  writeFileSync(filePath, nextContent, 'utf8');
  return true;
}

const defaultEnHeading =
  level === 'minor' ? 'Added' : level === 'major' ? 'Changed' : 'Fixed';
const defaultPtHeading =
  level === 'minor' ? 'Adicionado' : level === 'major' ? 'Alterado' : 'Corrigido';

if (dryRun) {
  console.log(
    `[dry-run] ${currentVersion} -> ${nextVersion} (${level})${scaffold ? ' [+scaffold em CHANGELOG.md e docs/pt-BR/CHANGELOG.md]' : ''}`,
  );
  process.exit(0);
}

writeFileSync(pkgPath, updatedPkg, 'utf8');
console.log(`Versão atualizada: ${currentVersion} -> ${nextVersion} (${level})`);

if (scaffold) {
  const enUpdated = insertReleaseScaffold(enChangelogPath, defaultEnHeading);
  const ptUpdated = insertReleaseScaffold(ptChangelogPath, defaultPtHeading);
  if (enUpdated) console.log(`Scaffold inserido em CHANGELOG.md ([${nextVersion}])`);
  if (ptUpdated) {
    console.log(`Scaffold inserido em docs/pt-BR/CHANGELOG.md ([${nextVersion}])`);
  }
} else {
  console.log(
    `Lembrete: documente a versão [${nextVersion}] em CHANGELOG.md e docs/pt-BR/CHANGELOG.md e valide com --check.`,
  );
}
