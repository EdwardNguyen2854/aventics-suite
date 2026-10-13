# Suite Host API v1

Suite Host serves local HTTP on a dynamic `127.0.0.1` port. Clients obtain the port and ephemeral token from the per-user rendezvous file and send:

```text
Authorization: Bearer <token>
```

All `/api/v1/*` endpoints require authentication.

## Error shape

```json
{
  "error": {
    "code": "COMPONENT_NOT_FOUND",
    "message": "Component not found: aventics.example"
  }
}
```

Current error codes include `AUTH_REQUIRED`, `COMPONENT_NOT_FOUND`, `CAPABILITY_NOT_FOUND`, `INVALID_EVENT`, `STORE_UNAVAILABLE`, `RESCAN_FAILED`, `NOT_FOUND`, and `INTERNAL_ERROR`.

## Status

`GET /api/v1/status` returns service/API versions, health, uptime, and catalog counts.

## Components and capabilities

`GET /api/v1/components` returns the merged component view: component-owned manifest data plus Suite-owned lifecycle/channel/repository metadata.

`GET /api/v1/capabilities` returns stable capability IDs, owner component, exposed interfaces, current availability, and `safety: unknown` until richer capability descriptors are adopted. The Host never invents safety metadata.

## Health and docs

Health v0.1 covers manifest validity, component-root accessibility, docs availability, and `runtime: unknown`. Deep Creo/Excel runtime probes are intentionally out of scope.

Docs endpoints resolve a component-declared docs path only when it stays inside the component root.

## Activity

`POST /api/v1/events` accepts Telemetry Contract v1 and returns HTTP 202 with an event ID when stored. If activity is disabled it returns 204. Invalid/privacy-rejected events return 400.

`GET /api/v1/activity/recent` returns newest-first events. `limit` is clamped to 1–200.

`GET /api/v1/activity/summary` aggregates counts by component, capability, and result.

## Diagnostics and rescan

`GET /api/v1/diagnostics` reports registry problems, invalid/unsupported manifests, duplicate component IDs, missing docs/health warnings, and unregistered discovered components.

`POST /api/v1/rescan` refreshes registry/discovery/catalog state. It does not install, update, launch, or modify any component.
