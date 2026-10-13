# Suite Host API v1

All `/api/v1/*` routes require the bearer token from the per-user rendezvous file.

## Core

- `GET /api/v1/status`
- `GET /api/v1/components`
- `GET /api/v1/components/:id`
- `GET /api/v1/capabilities`
- `GET /api/v1/capabilities/:id`
- `GET /api/v1/health`
- `GET /api/v1/health/:componentId`
- `GET /api/v1/docs`
- `GET /api/v1/docs/:componentId`
- `POST /api/v1/rescan`
- `GET /api/v1/search?q=...`

## AI and developer

- `GET /api/v1/skills`
- `GET /api/v1/mcp`
- `GET /api/v1/diagnostics`
- `GET /api/v1/logs/recent?limit=200`
- `POST /api/v1/validate/manifest`

## Activity and privacy

- `POST /api/v1/events`
- `GET /api/v1/activity/recent`
- `GET /api/v1/activity/summary`
- `DELETE /api/v1/activity`
- `GET /api/v1/settings`
- `PUT /api/v1/settings/activity`

## Releases

- `GET /api/v1/release`

The API does not expose arbitrary filesystem reads, command execution, component mutation, or engineering payload access.
