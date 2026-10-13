import path from "node:path";
import { readFile } from "node:fs/promises";
import { parse } from "yaml";
import type { McpProviderRecord } from "../domain/types.js";

interface ProviderConfig { id?: string; name?: string; component?: string; transport?: string; capabilityIds?: string[]; probePath?: string; }
export async function discoverMcpProviders(suiteRoot: string, endpointOverrides: Record<string, string>): Promise<{ providers: McpProviderRecord[]; errors: string[] }> {
  const errors: string[] = []; const providers: McpProviderRecord[] = [];
  try {
    const raw = parse(await readFile(path.join(suiteRoot, "registry", "mcp-providers.yaml"), "utf8")) as { providers?: ProviderConfig[] };
    for (const entry of raw.providers ?? []) {
      if (!entry.id || !entry.name || !entry.component) { errors.push(`Invalid MCP provider entry: ${JSON.stringify(entry)}`); continue; }
      const endpoint = endpointOverrides[entry.id] ?? null; const checkedAt = new Date().toISOString();
      if (!endpoint) { providers.push({ id: entry.id, name: entry.name, component: entry.component, transport: entry.transport ?? "http", endpoint: null, capabilityIds: entry.capabilityIds ?? [], status: "unconfigured", message: "No endpoint configured in host.json", checkedAt }); continue; }
      const result = await probe(endpoint, entry.probePath ?? "/health");
      providers.push({ id: entry.id, name: entry.name, component: entry.component, transport: entry.transport ?? "http", endpoint, capabilityIds: entry.capabilityIds ?? [], status: result.ok ? "healthy" : "unavailable", message: result.message, checkedAt });
    }
  } catch (error) { errors.push(`Unable to load MCP provider registry: ${String(error)}`); }
  return { providers: providers.sort((a, b) => a.name.localeCompare(b.name)), errors };
}
async function probe(endpoint: string, probePath: string): Promise<{ ok: boolean; message: string }> {
  try {
    const target = new URL(probePath, endpoint.endsWith("/") ? endpoint : `${endpoint}/`); const response = await fetch(target, { signal: AbortSignal.timeout(1200) });
    return { ok: response.ok, message: response.ok ? "Provider responded successfully" : `Provider returned HTTP ${response.status}` };
  } catch (error) { return { ok: false, message: `Provider unavailable: ${String(error)}` }; }
}
