#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/push-to-github.sh <git-remote-url> [branch]
# Examples:
#   ./scripts/push-to-github.sh git@github.com:TU_USUARIO/TU_REPO.git main
#   ./scripts/push-to-github.sh https://github.com/TU_USUARIO/TU_REPO.git main

REMOTE_URL="$1"
BRANCH="${2:-main}"

if [ -z "$REMOTE_URL" ]; then
  echo "Usage: $0 <git-remote-url> [branch]"
  exit 1
fi

echo "Preparing repository and pushing to: $REMOTE_URL (branch: $BRANCH)"

# Ensure script runs from repo root
cd "$(dirname "$0")/.." || exit 1

if [ ! -d .git ]; then
  git init
  git branch -M "$BRANCH"
fi

git add .
if git commit -m "Initial commit"; then
  echo "Committed changes.";
else
  echo "No changes to commit or commit failed (may already be up to date).";
fi

# Configure remote
if git remote | grep -q '^origin$'; then
  git remote remove origin || true
fi
git remote add origin "$REMOTE_URL"

echo "Pushing to remote..."
git push -u origin "$BRANCH"

echo "Done. If push failed due to auth, ensure SSH key is added to GitHub or use HTTPS with a token." 
