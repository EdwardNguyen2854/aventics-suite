import type { CapabilityRecord, ComponentRecord, DiscoveredComponent, RegistryEntry } from "../domain/types.js";
import { resolveDocs } from "../docs/docs-service.js";
import { buildComponentHealth } from "../health/health-service.js";

export async function buildCatalog(discovered: DiscoveredComponent[], registry: Map<string, RegistryEntry>): Promise<{ components: ComponentRecord[]; capabilities: CapabilityRecord[] }> {
  const components: ComponentRecord[] = [];
  const capabilities: CapabilityRecord[] = [];

  for (const item of discovered) {
    const manifest = item.manifest;
    const suite = registry.get(manifest.id);
    const docs = await resolveDocs(item.componentRoot, manifest);
    const health = await buildComponentHealth(item.componentRoot, docs);
    const interfaces = Object.entries(manifest.interfaces ?? {}).filter(([, enabled]) => enabled).map(([name]) => name).sort();
    const component: ComponentRecord = {
      id: manifest.id,
      name: manifest.name,
      version: manifest.version,
      type: manifest.type,
      maturity: manifest.maturity,
      host: manifest.host?.type ?? null,
      repository: suite?.repository ?? null,
      lifecycle: suite?.lifecycle ?? manifest.maturity,
      channel: suite?.channel ?? "unregistered",
      interfaces,
      capabilityIds: [...manifest.capabilities].sort(),
      telemetrySupported: manifest.telemetry?.supported === true,
      componentRoot: item.componentRoot,
      manifestPath: item.manifestPath,
      discoverySource: item.source,
      docs,
      health
    };
    components.push(component);

    for (const id of component.capabilityIds) {
      capabilities.push({
        id,
        component: component.id,
        interfaces: [...interfaces],
        availability: health.status === "healthy" ? "available" : health.status === "degraded" ? "degraded" : "unavailable",
        safety: "unknown"
      });
    }
  }

  components.sort((a, b) => a.id.localeCompare(b.id));
  capabilities.sort((a, b) => a.id.localeCompare(b.id));
  return { components, capabilities };
}
