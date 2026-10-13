# Aventics Skill Development

Create AI-readable engineering guidance that remains stable as component implementations evolve.

## Rules

- Depend on capability IDs instead of ports, classes, file paths, or framework internals.
- Keep `skill.json` metadata small and machine-readable.
- Put human/agent instructions in `SKILL.md`.
- Required capabilities must be explicit; optional capabilities should enhance rather than block the Skill.
- Reference Suite contracts and guidelines instead of duplicating them.
- Do not make a Skill the only source of truth for a product contract.
