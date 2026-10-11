# Application Development Guidelines

## Required boundary behavior for managed components

When applicable, a managed component should provide:

- stable component identity
- version information
- `aventics.manifest.json`
- meaningful capability declarations
- health/status information
- documentation discovery information
- telemetry using the Suite event contract when telemetry is enabled
- clear handling of read/write/destructive behavior

## Explicitly not standardized

Aventics Suite does not mandate:

- programming language
- UI framework
- database
- package manager
- internal folder layout
- state management library
- algorithm design
- application architecture pattern

Choose these based on the engineering problem.

## Shared package rule

Do not introduce a shared Suite package merely because two components could theoretically use it. Extract reusable implementation only after real duplication exists and a stable shared abstraction is clear.

## Experimental work

Experimental components should remain cheap to create. Promote them to managed components only after their value is demonstrated.
