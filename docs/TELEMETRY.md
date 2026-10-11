# Usage Tracking and Telemetry

## Purpose

Suite telemetry answers operational questions:

- Which capabilities are used?
- How often?
- Did they succeed or fail?
- How long did they take?
- Which component version ran?
- Was invocation through UI, MCP, CLI, automation, or an agent?

## Privacy-first default

Do not collect engineering content by default. Avoid customer names, project names, file names, paths, model names, workbook values, drawing data, prompts, agent conversations, or document contents.

## Best-effort rule

Telemetry must never block core engineering work. Failure to record an event must not fail the capability that produced it.

## Initial event vocabulary

- `component.started`
- `component.stopped`
- `capability.started`
- `capability.completed`
- `capability.failed`
- `skill.started`
- `skill.completed`
- `skill.failed`
- `mcp.called`
- `mcp.failed`
- `update.installed`

The vocabulary should stay small. Add events only when a real analytics question cannot be answered with existing events and metadata.

## Planned local storage

Initial Suite telemetry should be local-first, with a local store such as SQLite under user-local application data. Central/team aggregation is explicitly out of scope for the foundation phase.
