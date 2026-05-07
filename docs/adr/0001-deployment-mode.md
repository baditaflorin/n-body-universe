# 0001 - Deployment Mode

## Status

Accepted

## Context

N-Body Universe runs gravitational simulation, rendering, audio synthesis, and user-state persistence. V1 does not need accounts, shared writes, secrets, or server-side jobs.

## Decision

Use Mode A: Pure GitHub Pages.

The application is a static frontend published from `main` `/docs`. REBOUND is compiled to WebAssembly ahead of time and loaded lazily by the browser. Three.js renders in the client, Web Audio runs in the client, and user preferences are stored in browser storage.

Because REBOUND is GPL-3.0, this repository uses GPL-3.0-or-later instead of MIT.

## Consequences

No runtime backend, Docker image, nginx, runtime database, or hosted secrets are part of v1. The public operational surface is only GitHub Pages. Browser support is constrained by WebAssembly, WebGL/WebGPU availability, and normal static-site caching behavior.

## Alternatives Considered

Mode B was unnecessary because v1 has no offline data generation pipeline. Mode C was rejected because there is no runtime API, auth, mutation, or secret that justifies a backend.
