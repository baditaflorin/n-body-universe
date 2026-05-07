# 0013 - Testing Strategy

## Status

Accepted

## Context

The project needs confidence in physics helpers, UI initialization, the static Pages build, and the WASM happy path.

## Decision

Use Vitest for TypeScript unit tests, Playwright for one headless happy-path smoke test, and `scripts/smoke.sh` to build, serve `docs/`, and run Playwright against the static output.

## Consequences

`make test`, `make build`, and `make smoke` cover the v1 critical path. Physics validation focuses on conservation checks and resonance helpers, not on proving the full REBOUND library.

## Alternatives Considered

Manual-only browser testing was rejected because Pages path and WASM loading are easy to regress.
