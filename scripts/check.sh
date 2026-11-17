#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
cargo fmt --check
cargo clippy --no-default-features --features server -- -D warnings
cargo test --no-default-features
