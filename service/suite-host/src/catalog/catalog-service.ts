import type { CapabilityDescriptor, CapabilityRecord, ComponentRecord, DiscoveredComponent, RegistryEntry } from "../domain/types.js";
import { resolveDocs } from "../docs/docs-service.js";
import { buildComponentHealth } from "../health/health-service.js";
import { getRunningProcessNames, resolveRuntime } from "../health/runtime-service.js";

export async function buildCatalog(discovered: DiscoveredComponent[], registry: Map<string, RegistryEntry>, descriptors: Map<string, CapabilityDescriptor>): Promise<{ components: ComponentRecord[]; capabilities: CapabilityRecord[] }> {
  const components: ComponentRecord[] = []; const capabilities: CapabilityRecord[] = []; const running = await getRunningProcessNames();
  for (const item of discovered) {
    const manifest = item.manifest; const suite = registry.get(manifest.id); const docs = await resolveDocs(item.componentRoot, manifest); const runtime = resolveRuntime(suite, running); const health = await buildComponentHealth(item.componentRoot, docs, runtime);
    const interfaces = Object.entries(manifest.interfaces ?? {}).filter(([, enabled]) => enabled).map(([name]) => name).sort();
    const component: ComponentRecord = { id: manifest.id, name: manifest.name, version: manifest.version, type: manifest.type, maturity: manifest.maturity, host: manifest.host?.type ?? null, repository: suite?.repository ?? null, lifecycle: suite?.lifecycle ?? manifest.maturity, channel: suite?.channel ?? "unregistered", interfaces, capabilityIds: [...manifest.capabilities].sort(), telemetrySupported: manifest.telemetry?.supported === true, componentRoot: item.componentRoot, manifestPath: item.manifestPath, discoverySource: item.source, docs, runtime, health };
    components.push(component);
    for (const id of component.capabilityIds) {
      const descriptor = descriptors.get(id); const requiresRuntime = descriptor?.requiresRuntime ?? runtime.processNames.length > 0;
      const availability = health.status === "unavailable" ? "unavailable" : health.status === "degraded" ? "degraded" : requiresRuntime && runtime.state === "stopped" ? "inactive" : "available";
      capabilities.push({ id, name: descriptor?.name ?? humanize(id), description: descriptor?.description ?? "No capability description registered.", category: descriptor?.category ?? "Other", component: component.id, interfaces: descriptor?.interfaces ?? [...interfaces], availability, safety: descriptor?.safety ?? "unknown", requiresRuntime });
    }
  }
  components.sort((a, b) => a.id.localeCompare(b.id)); capabilities.sort((a, b) => a.id.localeCompare(b.id)); return { components, capabilities };
}
function humanize(id: string): string { return id.split(".").at(-1)?.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ") ?? id; }
