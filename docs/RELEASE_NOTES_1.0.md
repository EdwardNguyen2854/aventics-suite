# Aventics Suite 1.0 Release Notes

## Highlights

- Integrated engineer and developer desktop experiences.
- Production Suite Host with component discovery, contract validation, capability catalog, runtime state, health, docs, Skills, MCP provider discovery, activity, logs, diagnostics, settings, search, and release compatibility.
- Local-only metadata telemetry with explicit privacy exclusions and user-controlled retention.
- Offline documentation bundled into the desktop release.
- Per-user Windows packaging with no administrator requirement.
- Component versions remain independent; Suite releases record validated combinations.

## Contracts frozen for 1.0

- Manifest Contract v1
- Capability Contract v1
- Telemetry Contract v1
- Health Contract v1

Breaking contract changes require a new major contract version and a transition path.

## Known integration behavior

Runtime process detection is Windows-first. MCP provider endpoints are local configuration and are intentionally not hard-coded to developer machines.
