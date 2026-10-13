# Aventics MCP Development

Expose engineering capabilities through MCP without moving domain logic into the Suite.

## Rules

- Capability IDs are the stable abstraction; MCP tool names are an interface detail.
- Keep engineering logic in the owning component.
- Map every externally callable tool to a capability when a matching capability exists.
- Declare READ, PREVIEW, WRITE, or DESTRUCTIVE safety semantics.
- Prefer preview-first behavior for engineering modifications.
- Provider failure must not break the component's normal UI workflow.
- Never place customer data, filenames, drawing data, workbook values, or prompts into Suite telemetry.
