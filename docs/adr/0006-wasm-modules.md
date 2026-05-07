# 0006 - WASM Modules

## Status

Accepted

## Context

The pitch requires REBOUND, the C gravitational dynamics library used in research workflows. The browser must load it without server-side computation.

## Decision

Vendor the REBOUND C source used by the bridge, compile it with Emscripten to `public/wasm/rebound_module.js` and `public/wasm/rebound_module.wasm`, and access it from a Web Worker through a small C bridge API.

The generated module is lazy-loaded when the simulation starts. Worker isolation avoids blocking the UI. GitHub Pages cannot set COOP/COEP headers, so v1 avoids pthreads and SharedArrayBuffer-dependent builds.

## Consequences

The app ships GPL-3.0-or-later because REBOUND is GPL-3.0. Rebuilding WASM requires either Docker with `emscripten/emsdk` or a local `emcc`.

## Alternatives Considered

A JavaScript-only integrator was rejected because it would not meet the REBOUND value proposition. A threaded WASM build was rejected because GitHub Pages cannot provide the necessary headers.
