# Aventics Suite 1.0 Release Checklist

This checklist is the release gate for the first Stable Suite release.

## Automated gates

- [x] Suite Host compiles on Windows / Node 22.
- [x] Manifest discovery isolates invalid components.
- [x] Duplicate component IDs are diagnosed instead of merged silently.
- [x] Telemetry contract rejects engineering-content fields.
- [x] Local activity can be cleared and retention is configurable.
- [x] Host API requires the per-user bearer token.
- [x] Suite Host bundle is executed in CI, not merely compiled.
- [x] Desktop TypeScript/Vite/Electron build is validated on Windows.
- [x] Electron production package is generated on Windows.
- [x] NSIS installer is generated on Windows.
- [x] Packaged desktop starts its bundled Host and completes API smoke checks.
- [x] Installer artifact is retained by CI.

## Architecture gates

- [x] Components remain independently buildable and usable.
- [x] Suite Host binds to loopback only.
- [x] Discovery never executes component-provided commands.
- [x] User and Developer experiences share infrastructure but keep separate information architecture.
- [x] Capabilities, not MCP tools, are the stable external abstraction.
- [x] MCP providers remain component-owned.
- [x] Activity is local and metadata-only by default.
- [x] Core docs are bundled for offline use.
- [x] No mandatory shared SDK is required for component participation.

## Reference implementations

- [x] Native CAD extension: Creo Toolkit.
- [x] Office extension: Excel Toolkit.
- [x] Standalone Python/FastAPI application: Knowledge Base.
- [x] AI Skill catalog and provider registry.

## Deployment acceptance on an engineering workstation

The installer and package are automated release artifacts, but the following are workstation acceptance checks because CI cannot reproduce a corporate Creo/Excel installation:

1. Install as a standard Windows user without elevation.
2. Launch Aventics Suite and confirm Suite Host starts automatically.
3. Confirm local Creo, Excel and Knowledge Base manifests are discovered where installed/checked out.
4. Start/stop Creo and Excel and confirm runtime state changes without being reported as component failure.
5. Disconnect the network and confirm Home, Tools, Activity, Developer diagnostics and bundled docs remain usable.
6. Close Suite Host and confirm Creo/Excel workflows continue independently.
7. Reopen Suite and confirm Host recovery/reconnection.

These checks validate the target workstation environment rather than missing product implementation.
