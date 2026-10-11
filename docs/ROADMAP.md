# Roadmap

## Phase 0 — Architecture

- define architecture principles
- define component and capability models
- define ADR process
- define initial manifest and telemetry contracts

## Phase 1 — Foundation

- validate contracts against Creo Toolkit and Excel Toolkit
- add component manifests to real components
- create App Development Skill
- create initial Suite registry
- establish documentation conventions

## Phase 2 — Suite Host

- component discovery
- manifest loading
- capability catalog
- health checks
- local telemetry
- docs discovery

## Phase 3 — User GUI

Initial pages: Home, Apps, Tools, Activity, Docs, Settings.

## Phase 4 — Developer GUI

Initial pages: Components, Capabilities, Health, Telemetry, Logs, Skills, Validation.

The first Developer GUI should be observational, not a cross-repo mutation tool.

## Phase 5 — Developer workflow

- validation tooling
- app/Skill/MCP templates where justified
- additional development Skills

## Phase 6 — MCP integration

- provider discovery
- capability association
- safety metadata
- usage tracking

## Phase 7 — Release management

- Suite release manifests
- compatibility matrix
- Development / Pilot / Stable channels
- selective integration tests

## Phase 8 — Migration tooling

Only after a real breaking contract change exists: detect, preview, validate, and then optionally apply migrations.

## Phase 9 — Advanced management

Only when justified: central updater, repo automation, PR generation, team telemetry aggregation, and workflow orchestration.
