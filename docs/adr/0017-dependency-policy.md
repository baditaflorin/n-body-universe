# 0017 - Dependency Policy

## Status

Accepted

## Context

The app mixes numerical simulation, rendering, audio, and browser tooling. Custom implementations increase risk where strong libraries exist.

## Decision

Use production-grade dependencies for core domains: REBOUND for gravitational dynamics, Three.js for rendering, React for controls, Comlink for worker RPC, Zod for storage validation, Vitest and Playwright for tests, and Emscripten for WASM builds.

## Consequences

Dependencies must be pinned through lockfiles and periodically audited. GPL obligations from REBOUND shape the project license.

## Alternatives Considered

Hand-rolled rendering, worker protocol abstractions, or simulation kernels were rejected where a mature library exists.
