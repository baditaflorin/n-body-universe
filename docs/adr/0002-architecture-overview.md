# 0002 - Architecture Overview

## Status

Accepted

## Context

The app needs a responsive scientific sandbox without a backend. It must keep heavy numerical work off the main UI thread and expose clear module boundaries.

## Decision

Use a Mode A static frontend split into these modules:

- `features/simulation`: presets, REBOUND WASM worker, snapshot normalization, resonance analysis.
- `features/scene`: Three.js renderer, camera controls, picking, mesh lifecycle.
- `features/audio`: Web Audio harmonic synthesis from measured orbital periods.
- `features/storage`: local settings and saved universe snapshots.
- `ui`: shell, controls, stats, toasts, and error boundary.

## Consequences

The worker owns simulation state. React owns controls and presentational state. Rendering is imperative because Three.js scene updates are frame-oriented.

## Alternatives Considered

Running simulation on the main thread was rejected to preserve UI responsiveness. A runtime backend was rejected in ADR 0001.
