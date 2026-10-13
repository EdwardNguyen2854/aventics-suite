# Aventics Suite Host

Suite Host v0.1 is the local, offline-first control plane shared by the future Aventics Suite User GUI and Developer GUI.

It discovers Suite components through `aventics.manifest.json`, validates Contract v1, merges Suite-level registry metadata, builds component/capability catalogs, reports basic health and docs availability, accepts metadata-only telemetry, and exposes diagnostics through an authenticated loopback API.

## Non-goals

Suite Host does **not** execute Creo/Excel engineering logic, install or update components, mutate Git repositories, route MCP, or provide cloud telemetry. Core engineering components must continue to work when Suite Host is absent or unhealthy.

## Runtime

- Node.js 22+
- binds only to `127.0.0.1`
- uses a dynamic free port
- one instance per OS user
- writes rendezvous metadata to `%LOCALAPPDATA%\\AventicsSuite\\runtime\\suite-host.json` on Windows
- every `/api/v1/*` request requires the ephemeral bearer token from the rendezvous file
- no permissive CORS headers are enabled

## Development

```powershell
cd service\suite-host
npm install
$env:AVENTICS_SUITE_DEV = "1"
npm test
npm run dev
```

Development mode adds `C:\\local\\dev` to the default discovery roots on Windows.

Optional environment variables:

- `AVENTICS_SUITE_ROOT` — repository root when automatic root detection is not suitable.
- `AVENTICS_SUITE_DATA` — override local Suite state directory.
- `AVENTICS_COMPONENT_PATHS` — explicit component roots, separated by the OS path delimiter.
- `AVENTICS_COMPONENT_ROOTS` — additional managed discovery roots.
- `AVENTICS_DEVELOPMENT_ROOTS` — additional development roots.

A local config may be placed at `%LOCALAPPDATA%\\AventicsSuite\\config\\host.json`; see `host.example.json`. Invalid JSON is ignored with a warning and defaults remain usable.

## Discovery precedence

When the same component ID is discovered more than once:

1. explicit component path
2. managed installation root
3. development root

The selected component remains usable and the conflict is surfaced through diagnostics. Discovery never executes component code and skips common build/cache directories.

## API v1

- `GET /api/v1/status`
- `GET /api/v1/components`
- `GET /api/v1/components/:id`
- `GET /api/v1/capabilities`
- `GET /api/v1/capabilities/:id`
- `GET /api/v1/health`
- `GET /api/v1/health/:componentId`
- `GET /api/v1/docs`
- `GET /api/v1/docs/:componentId`
- `GET /api/v1/activity/recent?limit=50`
- `GET /api/v1/activity/summary`
- `GET /api/v1/diagnostics`
- `POST /api/v1/events`
- `POST /api/v1/rescan`

See `docs/API.md` for response conventions.

## Activity storage

v0.1 intentionally uses an append-only JSONL store behind the `ActivityStore` interface. This avoids native SQLite packaging dependencies while keeping the storage boundary replaceable. Retention is applied best-effort on writes (default 90 days).

Telemetry is metadata-only. The Host rejects payloads containing known engineering-content keys such as customer/project/file/workbook/model/prompt/conversation fields. Telemetry failures never need to block component workflows; component integrations should treat event delivery as best effort.

## Safety and failure isolation

- invalid component manifests do not stop other components from loading
- broken registry metadata degrades diagnostics but does not execute component code
- missing docs degrade only that component's docs status
- activity-store failures affect activity endpoints, not discovery/catalog endpoints
- unsupported contract versions are reported rather than executed or guessed
- manifests are size-limited to 256 KiB
- API request bodies are limited to 64 KiB
- the Host exposes no arbitrary filesystem read or component mutation endpoint
