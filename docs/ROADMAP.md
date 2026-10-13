# Aventics Suite Roadmap

## 1.0 — Stable product baseline

Aventics Suite 1.0 establishes the production architecture and first complete local product experience:

- contract-first component integration;
- Suite Host local control plane;
- engineer-facing desktop workspace;
- separate Developer experience over the same Host;
- component/capability discovery;
- Windows runtime state and health;
- local activity/privacy controls;
- offline documentation;
- Skills and MCP provider discovery;
- diagnostics, logs, validation and CLI tooling;
- release compatibility and per-user Windows installer;
- Creo Toolkit, Excel Toolkit and Knowledge Base as three deliberately different reference architectures.

Migration tooling remains intentionally dormant until the first real breaking contract change exists. A migration framework without a real migration target would create policy and complexity without evidence.

## Post-1.0 priorities

### 1.1 — Daily-use refinement

- collect engineer feedback from Stable deployment;
- improve component launch integration only where components provide safe launch metadata;
- add richer runtime health providers where useful;
- improve global search and favorites from real usage patterns;
- expand capability descriptions as interfaces mature.

### 1.x — Agent workflows

- prove additional preview-first CAD/Excel agent workflows;
- grow Skills based on real engineering tasks;
- add an optional MCP gateway only if multiple-provider routing becomes a real usability problem.

### Later, evidence-driven only

- migration tooling after a real breaking contract exists;
- team-level telemetry only with explicit privacy/governance requirements;
- cross-repo automation only after preview/review workflows are proven;
- central updater only where replacing component-owned update mechanisms creates measurable value.
