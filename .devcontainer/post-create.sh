#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

npm --prefix frontend install

echo
echo "Dev container ready."
echo "Run: ./scripts/dev.sh"
echo "Then open: http://localhost:5173"
