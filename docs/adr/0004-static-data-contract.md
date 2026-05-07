# 0004 - Static Data Contract

## Status

Accepted

## Context

Mode A has no backend data pipeline, but the app still ships static presets, app metadata, and WASM assets.

## Decision

Store small curated universe presets in TypeScript modules under `src/features/simulation/presets.ts`. Store app version in compile-time constants. Resolve the current public `main` commit through the unauthenticated GitHub commits API with a static fallback. Store the REBOUND WASM bridge in `public/wasm/` with source in `src/wasm/` and `vendor/rebound/`.

## Consequences

No versioned JSON data contract is needed for v1. Preset schema changes are covered by TypeScript and unit tests.

## Alternatives Considered

Committed JSON was rejected for presets because TypeScript gives better editor support and easier physical-unit documentation.
