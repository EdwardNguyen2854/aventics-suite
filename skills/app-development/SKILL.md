# Aventics App Development

## Purpose

Use this Skill when creating or evolving an application that will participate in Aventics Suite.

## Core rule

**Standardize boundaries, not implementations.** Choose the technology and internal architecture best suited to the engineering problem. Do not force Electron, React, Python, C++, SQLite, or any other stack unless the problem or existing component architecture requires it.

## Before implementation

1. Identify whether the work is experimental, incubating, managed, or stable.
2. Identify the component type: extension, app, service, or agent asset.
3. Identify externally meaningful capabilities. Do not register internal helper functions as capabilities.
4. Classify externally callable capabilities as read, preview, write, or destructive.
5. Check the current manifest, capability, health, and telemetry contracts in this repository.
6. Check the relevant Suite guidelines.
7. Reuse existing component architecture when extending an existing component.

## Managed component requirements

When applicable:

- add or maintain `aventics.manifest.json`
- use stable component and capability IDs
- provide docs discovery information
- expose health/status in a form compatible with the current contract
- emit telemetry only as best-effort operational metadata
- never make telemetry failure block engineering work
- preserve independent build/use of the component unless there is a documented reason not to

## Capability design

Prefer one authoritative engineering implementation behind multiple interfaces.

Do not couple Skills or external workflows to ports, internal classes, UI selectors, or private implementation details when a stable capability exists.

## UI

Follow Suite UI guidelines for terminology, status, safety, and product identity, but select workflow and layout based on the host/application context.

## Shared code

Do not create a Suite-wide library preemptively. Extract shared implementation only after proven duplication and a clear stable abstraction.

## Breaking changes

Prefer additive evolution. If a contract change is breaking, create a new contract version and preserve a transition path rather than silently changing existing behavior.

## Definition of done for managed work

- component still builds independently
- relevant tests pass
- manifest/capability metadata is valid
- write/destructive behavior is explicit
- telemetry is best-effort and metadata-only
- docs are updated
- no unnecessary Suite runtime dependency was introduced
