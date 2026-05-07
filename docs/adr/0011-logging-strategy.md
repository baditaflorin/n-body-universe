# 0011 - Logging Strategy

## Status

Accepted

## Context

There is no server-side logging in Mode A. Browser console noise should stay low in production.

## Decision

Use minimal browser console logging only for development and unrecoverable initialization failures. User-facing errors appear in the UI.

## Consequences

No logs are collected from users. Debugging production issues depends on reproducible reports and local browser diagnostics.

## Alternatives Considered

Remote log beacons were rejected to keep v1 private and static.
