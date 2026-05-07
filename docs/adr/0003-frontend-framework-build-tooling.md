# 0003 - Frontend Framework And Build Tooling

## Status

Accepted

## Context

The app needs strict TypeScript, a fast dev server, static builds, and a UI layer capable of dense controls around a canvas.

## Decision

Use Vite, React, TypeScript strict mode, Tailwind CSS, Three.js, Comlink, Zod, Vitest, and Playwright.

## Consequences

The production app builds to static assets in `docs/`. Worker and WASM loading are handled by browser APIs and Vite asset paths.

## Alternatives Considered

Vanilla TypeScript was rejected because the control surface benefits from component structure. Next.js and server-oriented frameworks were rejected because they add unnecessary deployment assumptions.
