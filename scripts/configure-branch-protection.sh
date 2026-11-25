#!/usr/bin/env bash
set -euo pipefail

# Aplica proteção rigorosa na branch "main" via GitHub CLI (gh).
# Uso:
#   ./scripts/configure-branch-protection.sh <owner>/<repo>

if [ $# -lt 1 ]; then
  echo "Uso: $0 <owner>/<repo>"
  exit 1
fi

REPO="$1"
BRANCH="main"

if ! command -v gh >/dev/null 2>&1; then
  echo "Erro: GitHub CLI (gh) não encontrado. Instale em https://cli.github.com/"
  exit 1
fi

echo "Configurando proteção da branch '${BRANCH}' em '${REPO}'..."

gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  "/repos/${REPO}/branches/${BRANCH}/protection" \
  --input - <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "Guardrails & Secrets Check",
      "Server Core & Safe Probes Tests",
      "UI Tests, Typecheck & Next.js Build"
    ]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 1
  },
  "restrictions": null,
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": true
}
JSON

echo "Proteção da branch '${BRANCH}' aplicada com sucesso!"
