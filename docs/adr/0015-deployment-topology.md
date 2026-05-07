# 0015 - Deployment Topology

## Status

Accepted

## Context

Mode A uses GitHub Pages only.

## Decision

Deploy static files from `main` `/docs` to https://baditaflorin.github.io/n-body-universe/. There is no backend, Docker Compose stack, nginx config, runtime port, Prometheus endpoint, or server runbook.

## Consequences

Operations are limited to git commits, Pages rebuilds, and rollbacks via revert. Browser caches are controlled by hashed assets.

## Alternatives Considered

Docker backend deployment was rejected by ADR 0001.
