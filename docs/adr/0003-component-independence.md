# ADR 0003: Preserve component independence

**Status:** Accepted

## Decision

Suite infrastructure is not an unnecessary prerequisite for core engineering workflows. Components should continue functioning when Suite Host, telemetry, docs, or developer tooling are unavailable.

## Consequence

Suite integrations must degrade gracefully and telemetry must be best-effort.
