#!/usr/bin/env bash
# Build the Rust fullstack app without requiring the Dioxus CLI.
set -euo pipefail

cd "$(dirname "$0")/.."

WASM_TARGET="wasm32-unknown-unknown"
WASM_BINDGEN="${WASM_BINDGEN:-wasm-bindgen}"
PROFILE="${PROFILE:-release}"
DIST="dist"
TARGET_DIR="${CARGO_TARGET_DIR:-target}"

if ! rustup target list --installed | grep -qx "$WASM_TARGET"; then
  echo "Missing Rust wasm target. Run: rustup target add $WASM_TARGET" >&2
  exit 1
fi

if ! command -v "$WASM_BINDGEN" >/dev/null 2>&1; then
  echo "Missing wasm-bindgen. Install it with:" >&2
  echo "  cargo install wasm-bindgen-cli --version 0.2.130" >&2
  exit 1
fi

rm -rf "$DIST"
mkdir -p "$DIST/assets/styles"
cp assets/index.html "$DIST/index.html"
cp assets/favicon.svg "$DIST/assets/favicon.svg"
cp assets/styles/*.css "$DIST/assets/styles/"

echo "Building WASM client…"
cargo build --bin learn-ai --features web --no-default-features --target "$WASM_TARGET" --profile "$PROFILE"
WASM_PATH="$TARGET_DIR/$WASM_TARGET/$PROFILE/learn-ai.wasm"
"$WASM_BINDGEN" --target web --no-typescript --out-dir "$DIST" "$WASM_PATH"

# Client artifacts are now in dist; free the WASM target before building the
# host server so constrained machines only need one target tree at a time.
rm -rf "$TARGET_DIR/$WASM_TARGET" "$TARGET_DIR/wasm-dev" "$TARGET_DIR/wasm-release"

echo "Building server…"
cargo build --bin learn-ai --features server --no-default-features --profile "$PROFILE"
PUBLIC="$TARGET_DIR/$PROFILE/public"
rm -rf "$PUBLIC"
mkdir -p "$PUBLIC"
cp -r "$DIST"/* "$PUBLIC"/

echo "Built $TARGET_DIR/$PROFILE/learn-ai"
echo "Run: LEARN_AI_DATABASE_URL=sqlite:///$PWD/learnai.db $TARGET_DIR/$PROFILE/learn-ai"
echo "Open: http://localhost:8080"
