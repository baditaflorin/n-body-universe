#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$ROOT/public/wasm"
mkdir -p "$OUT_DIR"

EMCC_ARGS=(
  -O3
  -std=c99
  -D_GNU_SOURCE
  -I "$ROOT/vendor/rebound/src"
  "$ROOT"/vendor/rebound/src/*.c
  "$ROOT/src/wasm/rebound_bridge.c"
  -sMODULARIZE=1
  -sEXPORT_ES6=1
  -sEXPORT_NAME=createReboundModule
  -sENVIRONMENT=web,worker
  -sALLOW_MEMORY_GROWTH=1
  -sSTACK_SIZE=1048576
  -sEXPORTED_RUNTIME_METHODS='["ccall","cwrap","HEAPF64"]'
  -sEXPORTED_FUNCTIONS='["_malloc","_free","_nu_reset","_nu_add_particle","_nu_move_to_com","_nu_step","_nu_particle_count","_nu_time","_nu_energy","_nu_get_particle_buffer","_nu_rebound_version"]'
  -o "$OUT_DIR/rebound_module.js"
)

if command -v emcc >/dev/null 2>&1; then
  emcc "${EMCC_ARGS[@]}"
else
  docker run --rm \
    -v "$ROOT:/src" \
    -w /src \
    emscripten/emsdk:4.0.15 \
    emcc "${EMCC_ARGS[@]/$ROOT/\/src}"
fi
