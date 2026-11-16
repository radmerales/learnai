#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example"
fi

# A .venv created on the host points at an interpreter that does not exist
# inside the container, so recreate it when it cannot actually run.
if ! .venv/bin/python -c 'import sys' >/dev/null 2>&1; then
  rm -rf .venv
  python -m venv .venv
fi

.venv/bin/pip install --upgrade pip
.venv/bin/pip install -r backend/requirements-dev.txt

if [ -f frontend/package.json ]; then
  npm --prefix frontend install
fi

echo
echo "Dev container ready."
echo "Start both servers with: ./scripts/dev.sh"
