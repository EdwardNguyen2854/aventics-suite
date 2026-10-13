# Aventics Suite

Aventics Suite is the local-first engineering workspace, control plane, documentation system, developer platform, and AI integration boundary for Aventics engineering software.

> **Core principle:** standardize boundaries, not implementations.

## v1.0

Aventics Suite 1.0 provides one desktop product with two distinct experiences:

- **Aventics Suite** — engineer-facing Home, Apps, Tools, AI, Activity, Updates, Docs, Settings, and About.
- **Aventics Developer** — Components, Capabilities, Health, Logs, Skills, MCP, Validation, Releases, Diagnostics, and developer documentation.

Both are backed by the same local **Suite Host**. Managed components remain independently buildable and usable when Suite is unavailable.

## Architecture

```text
User UI ───────┐
               ├── Suite Host ── discovery / catalog / health / activity / docs
Developer UI ──┘                    │
                                    ├── Creo Toolkit
                                    ├── Excel Toolkit
                                    └── future apps and providers
```

Suite Host binds only to loopback, uses an ephemeral bearer token, works offline, and never executes arbitrary component code during discovery.

## Development quick start

```powershell
# Host
cd service\suite-host
npm install
npm test

# Desktop
cd ..\..\apps\desktop
npm install
npm run dev
```

Development mode scans `C:\local\dev` for nearby `aventics.manifest.json` files. Production discovery remains explicit and managed-root based.

## Product contracts

- `contracts/manifest/v1` — component identity and integration boundary
- `contracts/capability/v1` — stable capability metadata and safety
- `contracts/telemetry/v1` — metadata-only activity events
- `contracts/health/v1` — health/status boundary

Contracts are versioned for compatibility. Guidelines are living recommendations. Shared packages are created only after proven reuse.

## Privacy

Suite telemetry is local by default and intentionally excludes customer names, project names, filenames, CAD model names, workbook content, prompts, conversations, drawing data, and engineering values. Users can disable or clear local activity history.

## Status

`feature/v1.0` contains the complete 1.0 implementation candidate. Stable release promotion happens only after Windows/no-admin/offline packaging and integration checks are green.
