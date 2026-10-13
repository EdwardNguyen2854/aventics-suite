import type { HostConfig } from "./config/config.js";
import type { ContractValidator } from "./contracts/validator.js";
import type { CapabilityRecord, ComponentRecord, DiagnosticItem, DiagnosticsSnapshot } from "./domain/types.js";
import { DiscoveryService } from "./discovery/discovery-service.js";
import { loadSuiteRegistry } from "./registry/registry-loader.js";
import { buildCatalog } from "./catalog/catalog-service.js";
import type { ActivityService } from "./activity/activity-service.js";
import type { HostLogger } from "./logging/logger.js";

export class SuiteHostContext {
  readonly startedAt = new Date();
  components: ComponentRecord[] = [];
  capabilities: CapabilityRecord[] = [];
  diagnostics: DiagnosticsSnapshot = { status: "healthy", checkedAt: new Date().toISOString(), items: [] };
  private rescanPromise: Promise<void> | null = null;

  constructor(
    readonly version: string,
    readonly config: HostConfig,
    readonly suiteRoot: string,
    readonly validator: ContractValidator,
    readonly activity: ActivityService,
    readonly logger: HostLogger
  ) {}

  async rescan(): Promise<void> {
    if (this.rescanPromise) return this.rescanPromise;
    this.rescanPromise = this.performRescan().finally(() => { this.rescanPromise = null; });
    return this.rescanPromise;
  }

  status() {
    return {
      service: "aventics-suite-host",
      version: this.version,
      apiVersion: "1",
      status: this.diagnostics.status,
      uptimeSeconds: Math.floor((Date.now() - this.startedAt.getTime()) / 1000),
      components: this.components.length,
      capabilities: this.capabilities.length
    };
  }

  private async performRescan(): Promise<void> {
    const registry = await loadSuiteRegistry(this.suiteRoot);
    const discovery = await new DiscoveryService(this.validator, this.config).discover();
    const catalog = await buildCatalog(discovery.components, registry.entries);
    this.components = catalog.components;
    this.capabilities = catalog.capabilities;

    const items: DiagnosticItem[] = [];
    for (const message of registry.errors) items.push({ id: `registry:${items.length}`, severity: "error", source: "registry", message });
    for (const failure of discovery.failures) items.push({ id: `discovery:${failure.manifestPath}`, severity: "error", source: "discovery", message: failure.message, details: failure });
    for (const conflict of discovery.conflicts) items.push({ id: `conflict:${conflict.id}`, severity: "warning", source: "discovery", component: conflict.id, message: `Multiple installations discovered; selected ${conflict.selectedPath}`, details: conflict });
    for (const component of this.components) {
      if (component.health.status !== "healthy") items.push({ id: `health:${component.id}`, severity: "warning", source: "health", component: component.id, message: `Component health is ${component.health.status}`, details: component.health });
      if (!registry.entries.has(component.id)) items.push({ id: `registry-missing:${component.id}`, severity: "info", source: "registry", component: component.id, message: "Component is discovered but is not registered as an official Suite component" });
    }
    this.diagnostics = { status: items.some((item) => item.severity === "error" || item.severity === "warning") ? "degraded" : "healthy", checkedAt: new Date().toISOString(), items };
    this.logger.info("Component rescan complete", { components: this.components.length, capabilities: this.capabilities.length, diagnostics: items.length });
  }
}
