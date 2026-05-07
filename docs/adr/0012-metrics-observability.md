# 0012 - Metrics And Observability

## Status

Accepted

## Context

Mode A has no backend metrics endpoint. Analytics are optional and can collect user data if chosen carelessly.

## Decision

Ship no analytics in v1. Show local runtime metrics in the UI: body count, simulated time, energy drift, renderer mode, integrator, and frame rate.

## Consequences

Maintainers do not get aggregate usage numbers. Users get useful local diagnostics without telemetry.

## Alternatives Considered

Plausible or a custom beacon was rejected because usage analytics are not required for v1 success.
