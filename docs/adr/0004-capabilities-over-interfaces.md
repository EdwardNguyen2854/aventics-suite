# ADR 0004: Capabilities over interfaces

**Status:** Accepted

## Decision

Capabilities are the stable abstraction. UI, MCP, CLI, automation, and future mechanisms are interfaces that expose capabilities.

## Consequence

Skills and cross-component workflows should depend on capability IDs rather than implementation-specific transports.
