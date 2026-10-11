# Contributing

## Where work belongs

Put work in this repository when it defines or implements a cross-component Suite concern: contracts, Suite GUIs, Suite Host, docs platform, Skills, governance, validation, discovery, telemetry conventions, or Suite releases.

Put component-specific implementation in the component repository.

## Development principles

- prefer additive contract evolution
- keep components independently buildable
- do not introduce shared libraries before proven reuse
- treat telemetry as optional support infrastructure
- document architectural decisions that create long-term constraints
- preserve a low-friction path for experiments

## Branching

Use short-lived branches such as `feature/*`, `fix/*`, `refactor/*`, or purpose-specific foundation branches. `main` should represent the latest healthy state.
