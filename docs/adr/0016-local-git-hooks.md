# 0016 - Local Git Hooks

## Status

Accepted

## Context

The project explicitly avoids GitHub Actions, so checks need to run locally.

## Decision

Use plain `.githooks/` configured with `make install-hooks`. Hooks run formatting/lint/type checks, gitleaks, Conventional Commit validation, tests, build, and smoke checks.

## Consequences

Contributors must install hooks locally. The Makefile exposes each hook target for manual execution.

## Alternatives Considered

Lefthook was rejected to keep the hook system dependency-light.
