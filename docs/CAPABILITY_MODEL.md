# Capability Model

## Definition

A capability is a meaningful externally consumable engineering function owned by a component.

Examples:

- `creo.model.context`
- `creo.views.inspect`
- `creo.qc.weak-dimensions`
- `excel.workbook.context`
- `excel.images.audit`
- `excel.qc.run`

Internal helper functions are not Suite capabilities.

## Interfaces

A capability may be exposed through one or more interfaces:

- UI
- MCP
- CLI
- automation
- future interfaces

Capability identity must not depend on a transport or UI technology.

## Implementation principle

Where practical, multiple interfaces should reuse one authoritative engineering implementation.

```text
       Engineering capability
             /       \
            UI       MCP
```

Avoid duplicating engineering logic for human and agent interfaces.

## Safety classification

Externally callable capabilities should declare one of:

- `read` — does not modify engineering data.
- `preview` — generates a proposed/temporary result.
- `write` — changes working data.
- `destructive` — deletes, overwrites, saves, or performs high-impact batch modification.

## Stability

Skills and cross-component workflows should depend on capability IDs rather than implementation details, ports, classes, or internal module names.
