# Troubleshooting

## Suite Host unavailable

Close and reopen Aventics Suite. The desktop application checks `%LOCALAPPDATA%\AventicsSuite\runtime\suite-host.json`, removes stale runtime state through the Host single-instance logic, and starts a bundled Host when required.

## Component not discovered

Check that:

- `aventics.manifest.json` exists under an explicit, managed, or development discovery root;
- the manifest uses supported `schemaVersion` 1;
- the component ID is unique;
- Developer > Diagnostics does not report a validation failure.

Development mode searches `C:\local\dev` by default.

## Component says Not running

This is informational when the component is installed but its host process is closed. Runtime detection currently uses trusted Suite registry process metadata on Windows.

## Activity is empty

Only components that emit Telemetry Contract v1 events will create activity records. Activity can also be disabled in Settings.

## MCP says Unconfigured

Provider definitions are bundled, but endpoints are local configuration. Add provider endpoints under `mcp.endpoints` in `%LOCALAPPDATA%\AventicsSuite\config\host.json`. Unconfigured MCP does not affect normal component operation.

## Logs

Developer > Logs shows local Suite Host logs. Logs remain on the machine and are not automatically uploaded.
