import type { HostConfig } from "./config/config.js";
import { persistActivityConfig } from "./config/config.js";
import type { ContractValidator } from "./contracts/validator.js";
import type { CapabilityRecord, ComponentRecord, DiagnosticItem, DiagnosticsSnapshot, McpProviderRecord, ReleaseSnapshot, SkillRecord } from "./domain/types.js";
import { DiscoveryService } from "./discovery/discovery-service.js";
import { loadSuiteRegistry } from "./registry/registry-loader.js";
import { loadCapabilityDescriptors } from "./registry/capability-loader.js";
import { buildCatalog } from "./catalog/catalog-service.js";
import { discoverSkills } from "./skills/skills-service.js";
import { discoverMcpProviders } from "./mcp/mcp-service.js";
import { loadReleaseSnapshot } from "./release/release-service.js";
import type { ActivityService } from "./activity/activity-service.js";
import type { HostLogger } from "./logging/logger.js";

export class SuiteHostContext {
  readonly startedAt = new Date();
  components: ComponentRecord[] = []; capabilities: CapabilityRecord[] = []; skills: SkillRecord[] = []; mcpProviders: McpProviderRecord[] = []; release: ReleaseSnapshot | null = null;
  diagnostics: DiagnosticsSnapshot = { status: "healthy", checkedAt: new Date().toISOString(), items: [] };
  private rescanPromise: Promise<void> | null = null;
  constructor(readonly version: string, readonly config: HostConfig, readonly suiteRoot: string, readonly validator: ContractValidator, readonly activity: ActivityService, readonly logger: HostLogger) {}
  async rescan(): Promise<void> { if (this.rescanPromise) return this.rescanPromise; this.rescanPromise = this.performRescan().finally(() => { this.rescanPromise = null; }); return this.rescanPromise; }
  status() { return { service: "aventics-suite-host", version: this.version, apiVersion: "1", status: this.diagnostics.status, uptimeSeconds: Math.floor((Date.now() - this.startedAt.getTime()) / 1000), components: this.components.length, capabilities: this.capabilities.length, skills: this.skills.length, mcpProviders: this.mcpProviders.length }; }
  settings() { return { activity: { enabled: this.activity.isEnabled(), retentionDays: this.config.activity.retentionDays }, discovery: { explicitComponents: this.config.discovery.explicitComponents, managedRoots: this.config.discovery.managedRoots, developmentRoots: this.config.discovery.developmentRoots, maxDepth: this.config.discovery.maxDepth } }; }
  async updateActivitySettings(enabled: boolean, retentionDays: number): Promise<void> { const days = Math.max(1, Math.min(3650, Math.floor(retentionDays))); this.config.activity.enabled = enabled; this.config.activity.retentionDays = days; this.activity.setEnabled(enabled); this.activity.setRetentionDays(days); await persistActivityConfig(this.config.dataRoot, enabled, days); }
  search(query: string) { const q = query.trim().toLowerCase(); if (!q) return []; const results: Array<{ type: string; id: string; name: string; description: string }> = []; for (const c of this.components) if (`${c.id} ${c.name}`.toLowerCase().includes(q)) results.push({ type: "component", id: c.id, name: c.name, description: `${c.type} · ${c.version}` }); for (const c of this.capabilities) if (`${c.id} ${c.name} ${c.description} ${c.category}`.toLowerCase().includes(q)) results.push({ type: "capability", id: c.id, name: c.name, description: c.description }); for (const s of this.skills) if (`${s.id} ${s.name} ${s.description}`.toLowerCase().includes(q)) results.push({ type: "skill", id: s.id, name: s.name, description: s.description }); return results.slice(0, 100); }
  private async performRescan(): Promise<void> {
    const registry = await loadSuiteRegistry(this.suiteRoot); const descriptors = await loadCapabilityDescriptors(this.suiteRoot); const discovery = await new DiscoveryService(this.validator, this.config).discover(); const catalog = await buildCatalog(discovery.components, registry.entries, descriptors.entries);
    this.components = catalog.components; this.capabilities = catalog.capabilities; this.skills = await discoverSkills(this.suiteRoot, new Set(this.capabilities.map((item) => item.id)));
    const mcp = await discoverMcpProviders(this.suiteRoot, this.config.mcp.endpoints); this.mcpProviders = mcp.providers; const release = await loadReleaseSnapshot(this.suiteRoot, this.components); this.release = release.snapshot;
    const items: DiagnosticItem[] = [];
    for (const message of [...registry.errors, ...descriptors.errors, ...mcp.errors, ...release.errors]) items.push({ id: `registry:${items.length}`, severity: "error", source: "registry", message });
    for (const failure of discovery.failures) items.push({ id: `discovery:${failure.manifestPath}`, severity: "error", source: "discovery", message: failure.message, details: failure });
    for (const conflict of discovery.conflicts) items.push({ id: `conflict:${conflict.id}`, severity: "warning", source: "discovery", component: conflict.id, message: `Multiple installations discovered; selected ${conflict.selectedPath}`, details: conflict });
    for (const component of this.components) { if (component.health.status !== "healthy") items.push({ id: `health:${component.id}`, severity: "warning", source: "health", component: component.id, message: `Component health is ${component.health.status}`, details: component.health }); if (!registry.entries.has(component.id)) items.push({ id: `registry-missing:${component.id}`, severity: "info", source: "registry", component: component.id, message: "Component is discovered but is not registered as an official Suite component" }); }
    for (const skill of this.skills) if (skill.status !== "ready") items.push({ id: `skill:${skill.id}`, severity: skill.status === "invalid" ? "error" : "warning", source: "skills", message: `${skill.name}: ${skill.errors.join("; ")}` });
    for (const provider of this.mcpProviders) if (provider.status === "unavailable") items.push({ id: `mcp:${provider.id}`, severity: "warning", source: "mcp", component: provider.component, message: `${provider.name} is unavailable`, details: provider });
    this.diagnostics = { status: items.some((item) => item.severity === "error" || item.severity === "warning") ? "degraded" : "healthy", checkedAt: new Date().toISOString(), items };
    this.logger.info("Component rescan complete", { components: this.components.length, capabilities: this.capabilities.length, skills: this.skills.length, mcpProviders: this.mcpProviders.length, diagnostics: items.length });
  }
}
