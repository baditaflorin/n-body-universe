# Postmortem

## What Was Built

V1 ships a static GitHub Pages gravitational sandbox with React controls, Three.js rendering, a REBOUND WebAssembly worker, local persistence, visible version/commit metadata, repository and PayPal links, and smoke-test coverage.

## Was Mode A Correct?

Yes. The app has no runtime secrets, shared writes, accounts, or server-side computation. The simulation runs in the browser through WASM, rendering uses browser GPU APIs, and audio uses Web Audio. Mode B and Mode C would add operational cost without improving v1.

## What Worked

GitHub Pages fit the product shape well. REBOUND already has Emscripten support, so the bridge could stay small and focused.

## What Did Not Work

GitHub Pages cannot provide COOP/COEP headers, so v1 avoids pthreads and SharedArrayBuffer-dependent WASM builds.

## Surprises

REBOUND's GPL-3.0 license means the project should not use the default MIT license when bundling REBOUND into the shipped WASM.

## Accepted Tech Debt

The WASM artifact is committed for Pages convenience. Rebuilds require Docker with Emscripten or a local `emcc`.

## Next Improvements

1. Add import/export for universe JSON files.
2. Add a richer orbital-elements inspector for eccentricity, inclination, and semi-major axis.
3. Add a WebGPU-specific particle renderer path for very large swarms.

## Time Spent Vs Estimate

Initial implementation fit within a single scaffolding session. The slowest step was compiling REBOUND WASM through Docker emulation on Apple Silicon.
