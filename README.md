# Aventics Suite

Aventics Suite is the product, control plane, development standard, documentation system, and integration layer for Aventics engineering software and AI capabilities.

> **Core principle:** standardize boundaries, not implementations.

Individual components remain independently buildable and usable. The Suite coordinates discovery, capabilities, documentation, telemetry, health, compatibility, Skills, and cross-component development without forcing a single language, framework, runtime, or internal architecture.

## Product model

- **Extensions** — Creo Toolkit, Excel Toolkit, and future host-integrated applications.
- **Apps** — standalone engineering applications such as knowledge, QC, and visualization tools.
- **AI** — MCP interfaces, Skills, agents, and workflows.
- **Platform** — discovery, capability registry, telemetry, diagnostics, documentation, and release coordination.
- **Development Platform** — contracts, guidelines, Skills, templates, validation, and migration support.

## Architecture principles

1. Suite standardizes boundaries, not implementations.
2. Components remain independently buildable and usable.
3. Suite infrastructure must not become an unnecessary runtime dependency.
4. Contracts are small, explicit, versioned, and backward-compatible where practical.
5. Guidelines are flexible recommendations, not APIs.
6. Templates accelerate development but do not define architecture.
7. Shared libraries are created only after proven reuse.
8. Capabilities are the stable abstraction; UI, MCP, CLI, and automation are interfaces.
9. Skills depend on capabilities rather than implementation details.
10. Telemetry is metadata-only and best-effort by default.
11. Experimental development has a low entry barrier.
12. Breaking changes require a migration path and transition period.
13. User and developer experiences are separate views of the same platform.
14. Compatibility matters more than perfect conformity.
15. Preview-first is preferred for automated engineering changes.
16. This repository owns cross-component architecture and governance; component repositories own implementations.

## Status

The repository is in the foundation phase. Runtime GUIs and Suite Host will be added only after the contracts and component model have been validated against real components such as Creo Toolkit and Excel Toolkit.
