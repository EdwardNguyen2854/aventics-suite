# Component Model

## Component types

Aventics Suite recognizes several broad component types:

- `extension` — runs in or alongside a host application such as Creo or Excel.
- `app` — standalone user-facing application.
- `service` — background/local service.
- `agent-asset` — Skill, workflow, or similar agent resource.

The type describes integration behavior, not implementation technology.

## Lifecycle

Components may move through:

```text
experimental → incubating → managed → stable → deprecated → retired
```

### Experimental

Low-friction prototypes and research. No Suite contract is required.

### Incubating

Promising project with basic ownership, README, and versioning.

### Managed

Official Suite component. Requires a manifest, docs, defined capabilities, and health/telemetry integration where applicable.

### Stable

Production-supported component with release validation, tests appropriate to its risk, and upgrade/rollback strategy where relevant.

### Deprecated / Retired

No longer recommended or no longer supported. Deprecation must be visible before removal from Suite releases.

## Manifest ownership

The component repository owns its `aventics.manifest.json`. The Suite registry must not duplicate fields that can be discovered from that manifest.

The Suite registry owns Suite-level facts such as approval status, channel, managed lifecycle, and inclusion in a Suite release.

## Independence rule

A component must remain independently buildable and usable unless a real product requirement makes a Suite dependency unavoidable.

## Exceptions

Contracts may allow documented exceptions when host constraints make a generic rule impractical. Exceptions should be explicit and reviewable rather than hidden.
