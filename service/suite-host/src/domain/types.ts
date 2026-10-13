export type ComponentType = "extension" | "app" | "service" | "agent-asset";
export type Maturity = "experimental" | "incubating" | "managed" | "stable" | "deprecated" | "retired";
export type DiscoverySource = "explicit" | "managed" | "development";
export type HealthStatus = "healthy" | "degraded" | "unavailable" | "unknown" | "invalid";
export type DiagnosticSeverity = "info" | "warning" | "error";
export type CapabilitySafety = "unknown" | "read" | "preview" | "write" | "destructive";
export type RuntimeState = "running" | "stopped" | "unknown";

export interface AventicsManifest {
  schemaVersion: string;
  id: string;
  name: string;
  version: string;
  type: ComponentType;
  maturity: Maturity;
  host?: { type?: string; [key: string]: unknown } | null;
  capabilities: string[];
  interfaces?: Record<string, boolean>;
  telemetry?: { supported?: boolean; [key: string]: unknown };
  docs?: { path?: string; [key: string]: unknown };
  [key: string]: unknown;
}

export interface RegistryEntry {
  id: string;
  repository?: string;
  lifecycle?: Maturity;
  channel?: string;
  manifestStatus?: string;
  approved?: boolean;
  runtime?: { processNames?: string[]; [key: string]: unknown };
  [key: string]: unknown;
}

export interface CapabilityDescriptor {
  schemaVersion: "1";
  id: string;
  name: string;
  component: string;
  description?: string;
  category?: string;
  safety: Exclude<CapabilitySafety, "unknown">;
  interfaces: string[];
  requiresRuntime?: boolean;
}

export interface DiscoveredComponent {
  manifest: AventicsManifest;
  componentRoot: string;
  manifestPath: string;
  source: DiscoverySource;
  precedence: number;
}

export interface DiscoveryFailure {
  manifestPath: string;
  source: DiscoverySource;
  code: "MANIFEST_INVALID" | "MANIFEST_UNREADABLE" | "SCHEMA_UNSUPPORTED";
  message: string;
  details?: unknown;
}

export interface DiscoveryConflict { id: string; selectedPath: string; paths: string[]; }
export interface DocsInfo { configured: boolean; available: boolean; path: string | null; reason?: string; }
export interface HealthCheck { status: HealthStatus; message?: string; }

export interface RuntimeInfo {
  state: RuntimeState;
  processNames: string[];
  message?: string;
}

export interface ComponentHealth {
  status: HealthStatus;
  checks: {
    manifest: HealthCheck;
    componentRoot: HealthCheck;
    docs: HealthCheck;
    runtime: HealthCheck;
  };
}

export interface ComponentRecord {
  id: string;
  name: string;
  version: string;
  type: ComponentType;
  maturity: Maturity;
  host: string | null;
  repository: string | null;
  lifecycle: Maturity;
  channel: string;
  interfaces: string[];
  capabilityIds: string[];
  telemetrySupported: boolean;
  componentRoot: string;
  manifestPath: string;
  discoverySource: DiscoverySource;
  docs: DocsInfo;
  runtime: RuntimeInfo;
  health: ComponentHealth;
}

export interface CapabilityRecord {
  id: string;
  name: string;
  description: string;
  category: string;
  component: string;
  interfaces: string[];
  availability: "available" | "inactive" | "degraded" | "unavailable";
  safety: CapabilitySafety;
  requiresRuntime: boolean;
}

export interface SkillRecord {
  id: string;
  name: string;
  description: string;
  path: string;
  requires: string[];
  optional: string[];
  status: "ready" | "degraded" | "invalid";
  missingCapabilities: string[];
  errors: string[];
}

export interface McpProviderRecord {
  id: string;
  name: string;
  component: string;
  transport: string;
  endpoint: string | null;
  capabilityIds: string[];
  status: "healthy" | "unavailable" | "unconfigured" | "unknown";
  message?: string;
  checkedAt: string;
}

export interface ReleaseCompatibility {
  component: string;
  validatedVersion: string;
  installedVersion: string | null;
  status: "validated" | "different" | "missing";
}

export interface ReleaseSnapshot {
  suiteVersion: string;
  channel: string;
  releasedAt: string;
  components: ReleaseCompatibility[];
}

export interface DiagnosticItem { id: string; severity: DiagnosticSeverity; source: string; component?: string; message: string; details?: unknown; }
export interface DiagnosticsSnapshot { status: "healthy" | "degraded"; checkedAt: string; items: DiagnosticItem[]; }

export interface TelemetryEvent {
  schemaVersion: string;
  event: string;
  timestamp: string;
  component: string;
  componentVersion: string;
  capability?: string | null;
  interface?: string;
  durationMs?: number | null;
  result: string;
  errorCode?: string | null;
  [key: string]: unknown;
}

export interface StoredTelemetryEvent extends TelemetryEvent { _id: string; _receivedAt: string; }
