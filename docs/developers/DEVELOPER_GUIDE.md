# Developer Guide

## Integration philosophy

Aventics Suite standardizes component boundaries rather than internal architecture. C++, Python, TypeScript, Rust, Go, native host extensions, and web applications can all participate.

## Managed component minimum

A managed component should provide:

1. `aventics.manifest.json`;
2. stable capability IDs for meaningful external functions;
3. component documentation;
4. optional telemetry integration using Telemetry Contract v1;
5. runtime/health metadata where practical.

## Component independence

A managed component must remain buildable and usable without Suite Host running. Telemetry, documentation indexing, MCP discovery, and diagnostics are enhancement layers.

## Capability design

Use one capability for one meaningful engineering boundary. UI, MCP, CLI, and automation are interfaces over that capability rather than separate implementations.

Safety levels are `READ`, `PREVIEW`, `WRITE`, and `DESTRUCTIVE`. Prefer preview-first flows for engineering modifications.

## Validation

Use Developer > Validation or the CLI:

```powershell
node tooling\cli\aventics.mjs validate C:\path\to\aventics.manifest.json
```

Contract errors are blocking. Warnings and guideline differences should not be confused with compatibility failure.

## Skills

Each Suite Skill has `skill.json` plus `SKILL.md`. Required dependencies are stable capability IDs, not implementation classes, ports, or internal paths.

## MCP

Component-owned MCP providers retain engineering logic. Suite only discovers providers, reports health, maps capabilities, and exposes safety/diagnostic context.
