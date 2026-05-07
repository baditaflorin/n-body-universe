# 0009 - Configuration And Secrets Management

## Status

Accepted

## Context

Mode A should not need secrets, runtime environment variables, or private hostnames.

## Decision

Use build-time constants for version, commit, repository URL, PayPal URL, and base path. Keep `.env.example` with placeholders only. Prevent real `.env*`, keys, and PEM files from entering git. Use gitleaks in local hooks.

## Consequences

The frontend contains only public values. Changing runtime behavior requires a rebuild.

## Alternatives Considered

Runtime config files were rejected because there is no deployment-time secret or API URL to configure.
