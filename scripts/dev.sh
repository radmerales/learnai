#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -x .venv/bin/uvicorn ]; then
  echo "Backend dependencies are missing. Run .devcontainer/post-create.sh or:" >&2
  echo "  python -m venv .venv && .venv/bin/pip install -r backend/requirements-dev.txt" >&2
  exit 1
fi

(
  cd backend
  ../.venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
) &
BACKEND_PID=$!

npm --prefix frontend run dev &
FRONTEND_PID=$!

cleanup() {
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

wait
