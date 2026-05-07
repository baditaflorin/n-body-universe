# 0005 - Client Storage Strategy

## Status

Accepted

## Context

Users should keep local preferences and the last universe without requiring accounts or sync.

## Decision

Use `localStorage` for v1 preferences and the last saved universe. Validate stored payloads with Zod and ignore invalid records. Do not use IndexedDB or OPFS until saved scenarios become large.

## Consequences

State is local to one browser profile. Clearing browser data removes saved universes.

## Alternatives Considered

IndexedDB was rejected as unnecessary for the current payload size. Server persistence was rejected by ADR 0001.
