FROM rust:1.100-slim-trixie

ENV CARGO_INCREMENTAL=0 \
    RUSTUP_HOME=/usr/local/rustup \
    CARGO_HOME=/usr/local/cargo \
    PATH=/usr/local/cargo/bin:/usr/local/bin:$PATH

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        ca-certificates \
        curl \
        git \
        pkg-config \
        sudo \
    && rm -rf /var/lib/apt/lists/*

# WASM target and bindgen used by the separate client build.
RUN rustup target add wasm32-unknown-unknown \
    && curl -sSL https://github.com/wasm-bindgen/wasm-bindgen/releases/download/0.2.130/wasm-bindgen-0.2.130-x86_64-unknown-linux-musl.tar.gz \
        | tar -xz --strip-components=1 -C /usr/local/bin \
          wasm-bindgen-0.2.130-x86_64-unknown-linux-musl/wasm-bindgen \
    && chmod +x /usr/local/bin/wasm-bindgen

# Dioxus CLI is optional for the separate cargo build but useful for `dx serve`.
RUN curl -sSL https://github.com/DioxusLabs/dioxus/releases/download/v0.7.10/dx-x86_64-unknown-linux-gnu.tar.gz \
        | tar -xz -C /usr/local/bin dx \
    && chmod +x /usr/local/bin/dx

RUN useradd --create-home --user-group --shell /bin/bash vscode \
    && echo "vscode ALL=(root) NOPASSWD:ALL" > /etc/sudoers.d/vscode \
    && chmod 0440 /etc/sudoers.d/vscode

USER vscode
WORKDIR /workspace
