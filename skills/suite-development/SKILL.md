# Aventics Suite Development

Develop Aventics Suite as a resilient control plane rather than a mandatory framework.

## Principles

- Standardize boundaries, not implementations.
- Keep managed components independently buildable and usable.
- Suite Host, telemetry, docs, and MCP failures must not block engineering work.
- Prefer additive contract evolution and explicit migrations for breaking changes.
- Keep User and Developer experiences distinct even when they share infrastructure.
- Shared packages must emerge from proven reuse rather than anticipation.
- Treat no-admin, offline-capable Windows deployment as a primary environment.
