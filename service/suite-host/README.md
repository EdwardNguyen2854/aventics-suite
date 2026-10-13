# Aventics Suite Host 1.0

Suite Host is the local, per-user control plane shared by Aventics Suite and Aventics Developer.

## Responsibilities

- deterministic component discovery and Manifest Contract v1 validation;
- Suite registry merge and duplicate resolution;
- capability metadata and safety catalog;
- installed/running/health separation;
- documentation discovery;
- Skill discovery and dependency validation;
- MCP provider discovery and optional local health probes;
- metadata-only activity intake and local retention;
- local logs and Suite Doctor diagnostics;
- release compatibility reporting;
- settings and search APIs.

## Non-goals

Suite Host does not contain Creo/Excel engineering logic, replace component updaters, execute arbitrary manifest commands, perform cloud telemetry, or become a runtime requirement for managed components.

## Run

```powershell
npm install
npm test
$env:AVENTICS_SUITE_DEV="1"
npm run dev
```

Host binds to a dynamic `127.0.0.1` port and writes authenticated rendezvous data to `%LOCALAPPDATA%\AventicsSuite\runtime\suite-host.json`.

## Privacy

Activity is local and best-effort. Forbidden engineering-content keys are rejected before storage. Activity can be disabled, cleared, or assigned a retention period.
