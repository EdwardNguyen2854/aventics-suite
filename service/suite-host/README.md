# Suite Host

Planned local control-plane service shared by the User GUI and Developer GUI.

Initial responsibilities:

- component discovery
- manifest loading
- capability catalog
- health checks
- local telemetry/activity storage
- documentation discovery/indexing

Non-goals for the first implementation:

- central updater
- cross-repo writes
- cloud telemetry backend
- universal MCP implementation

Suite Host failure must not stop core component workflows.
