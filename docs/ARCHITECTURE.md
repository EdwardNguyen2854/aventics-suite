# Aventics Suite Architecture

## Purpose

Aventics Suite is the control plane, development standard, documentation system, and integration layer for Aventics engineering software and AI capabilities.

The Suite is intentionally **not** a mandatory runtime framework. Creo Toolkit, Excel Toolkit, standalone apps, services, and future components must remain independently buildable and usable.

## Core principle

> Standardize boundaries, not implementations.

A component may use C++, Python, TypeScript, Rust, .NET, Electron, Tauri, FastAPI, native UI, or another technology when appropriate. Suite contracts define how the component identifies itself, exposes capabilities, reports health, emits optional telemetry, and participates in Suite releases.

## Product model

```text
Aventics Suite
├─ Extensions
│  ├─ Creo Toolkit
│  └─ Excel Toolkit
├─ Apps
│  └─ standalone engineering applications
├─ AI
│  ├─ MCP interfaces
│  ├─ Skills
│  ├─ agents
│  └─ workflows
├─ Platform
│  ├─ discovery
│  ├─ capability registry
│  ├─ telemetry
│  ├─ diagnostics
│  ├─ documentation
│  └─ release coordination
└─ Development Platform
   ├─ contracts
   ├─ guidelines
   ├─ Skills
   ├─ templates
   ├─ validation
   └─ migrations
```

## Runtime direction

The planned runtime architecture is:

```text
             Suite Host
                │
      ┌─────────┴─────────┐
      ▼                   ▼
   User GUI         Developer GUI
      │                   │
      └─────────┬─────────┘
                ▼
      discovery / health /
      activity / docs index
                │
   ┌────────────┼─────────────┐
   ▼            ▼             ▼
 Creo Toolkit  Excel Toolkit  Other components
```

Suite Host failure must not stop core engineering work. Telemetry, docs, developer tooling, and Suite discovery are support infrastructure.

## Contracts vs guidelines

**Contracts** are machine-readable compatibility boundaries and are versioned when breaking compatibility matters.

**Guidelines** are living recommendations. They should not force rewrites of functioning components.

## Capability model

Capabilities are the stable product abstraction. UI, MCP, CLI, and automation are interfaces over capabilities.

```text
             Capability
          /      |       \
        UI      MCP      CLI/automation
```

MCP is therefore an interface, not the center of Suite architecture.

## Component independence

A managed component must not require the Suite repository to build. A component may integrate with Suite features, but the Suite must avoid becoming an unnecessary runtime or build-time bottleneck.

## Shared code policy

Shared libraries are created only after proven duplication across real consumers. The Suite does not pre-create a giant SDK.

## Safety

Externally callable capabilities should be classifiable as READ, PREVIEW, WRITE, or DESTRUCTIVE. Preview-first behavior is preferred for meaningful automated engineering changes.
