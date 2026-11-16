#!/usr/bin/env bash
# Start the API and frontend together for local development.
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -x .venv/bin/uvicorn ]; then
  echo "Backend dependencies are missing. Run .devcontainer/post-create.sh or:" >&2
  echo "  python -m venv .venv && .venv/bin/pip install -r backend/requirements-dev.txt" >&2
  exit 1
fi

# `( ... ) &` runs the backend in a subshell in the background; `$!` is its
# process ID. Vite starts the same way on the next lines.
(
  cd backend
  ../.venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
) &
BACKEND_PID=$!

npm --prefix frontend run dev &
FRONTEND_PID=$!

# `trap` is like a Python finally block for a shell process: stop both servers
# if this script exits or receives Ctrl+C.
cleanup() {
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

wait
