# 0014 - Error Handling Conventions

## Status

Accepted

## Context

Errors can happen in WASM loading, worker communication, WebGPU/WebGL setup, audio permission, and local storage parsing.

## Decision

Return typed results from logic modules where practical, throw only for unrecoverable initialization failures, catch at feature boundaries, and surface clear UI messages through a global toast/error banner.

## Consequences

The canvas should remain usable when optional systems fail. WebGPU failure falls back to WebGL. Audio failure leaves the visual simulation running.

## Alternatives Considered

Fail-fast app boot was rejected because optional capabilities should degrade independently.
