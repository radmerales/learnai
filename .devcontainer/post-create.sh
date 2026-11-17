#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example"
fi

rustup target add wasm32-unknown-unknown
cargo fetch

if [ -f package.json ]; then
  npm install
fi

echo
echo "Dev container ready."
echo "Build and run with: ./scripts/dev.sh"
echo "Or use Dioxus hot reload: dx serve --port 8080"
