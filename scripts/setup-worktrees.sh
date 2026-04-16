#!/bin/bash
# Setup dos worktrees para desenvolvimento paralelo
# Execute uma vez: bash scripts/setup-worktrees.sh

set -e

ROOT=$(git rev-parse --show-toplevel)
PARENT=$(dirname "$ROOT")

echo "======================================"
echo " claude-flow — Setup de Worktrees"
echo "======================================"
echo ""

create_worktree() {
  local branch=$1
  local dir="$PARENT/claude-flow-$2"

  if [ -d "$dir" ]; then
    echo "[SKIP] $dir já existe"
    return
  fi

  git branch "$branch" 2>/dev/null || echo "[INFO] Branch $branch já existe"
  git worktree add "$dir" "$branch"
  cp "$ROOT/.env.example" "$dir/.env" 2>/dev/null || true
  echo "[OK] Worktree criado: $dir (branch: $branch)"
}

create_worktree "feature/frontend"      "frontend"
create_worktree "feature/engine"        "engine"
create_worktree "feature/database"      "database"
create_worktree "feature/integrations"  "integrations"

echo ""
echo "======================================"
echo " Worktrees prontos!"
echo ""
echo " Terminal 1 (Frontend):"
echo "   cd $PARENT/claude-flow-frontend && claude"
echo ""
echo " Terminal 2 (Engine/Nós):"
echo "   cd $PARENT/claude-flow-engine && claude"
echo ""
echo " Terminal 3 (Banco de dados):"
echo "   cd $PARENT/claude-flow-database && claude"
echo ""
echo " Terminal 4 (Integrações/Cron):"
echo "   cd $PARENT/claude-flow-integrations && claude"
echo ""
echo " Em cada terminal, Claude lê o CLAUDE.md automaticamente."
echo " Diga apenas: 'construa o módulo X conforme o CLAUDE.md'"
echo "======================================"
