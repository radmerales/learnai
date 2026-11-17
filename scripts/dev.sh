#!/usr/bin/env bash
# Local development loop: build the Rust app and run it on port 8080.
# For Dioxus hot-reload development on a normal machine, use `dx serve`.
set -euo pipefail

cd "$(dirname "$0")/.."
./scripts/build.sh
TARGET_DIR="${CARGO_TARGET_DIR:-target}"
exec env LEARN_AI_DATABASE_URL="${LEARN_AI_DATABASE_URL:-sqlite:///$PWD/learnai.db}" \
  "$TARGET_DIR/release/learn-ai"
