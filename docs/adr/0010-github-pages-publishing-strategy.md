# 0010 - GitHub Pages Publishing Strategy

## Status

Accepted

## Context

GitHub Pages must work from the first commit. Vite normally writes to `dist/`, but Pages is configured to serve a committed folder from the default branch.

## Decision

Publish from `main` branch `/docs`. The Vite build writes directly into `docs/`, and `docs/` is intentionally not gitignored. The Vite base path is `/n-body-universe/`. The build emits hashed assets for cache busting and keeps a `404.html` fallback for direct SPA routes.

Live URL: https://baditaflorin.github.io/n-body-universe/

## Consequences

Each release includes generated frontend assets in git. Rollback is a normal git revert of the publishing commit. `_headers` and `_redirects` are not used because GitHub Pages does not support them.

## Alternatives Considered

A `gh-pages` branch was rejected to keep local hooks, review, and generated assets in one branch. Publishing from repository root was rejected because source files and built assets would be mixed.
