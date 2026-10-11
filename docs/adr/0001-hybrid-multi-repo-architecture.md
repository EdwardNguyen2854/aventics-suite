# ADR 0001: Hybrid multi-repo architecture

**Status:** Accepted

## Decision

Keep product implementations such as Creo Toolkit and Excel Toolkit in independent repositories. Use `aventics-suite` for cross-component contracts, governance, Skills, docs, Suite GUIs, and future Suite Host.

## Rationale

Components have different hosts, runtimes, build systems, and release cadences. A forced monorepo would add coupling without solving those differences.

## Consequence

Cross-component integration requires explicit contracts and selective integration testing.
