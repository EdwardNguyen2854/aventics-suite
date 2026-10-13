import path from "node:path";
import { readFile } from "node:fs/promises";
import { parse } from "yaml";
import type { CapabilityDescriptor } from "../domain/types.js";

export async function loadCapabilityDescriptors(suiteRoot: string): Promise<{ entries: Map<string, CapabilityDescriptor>; errors: string[] }> {
  const entries = new Map<string, CapabilityDescriptor>(); const errors: string[] = [];
  try {
    const raw = parse(await readFile(path.join(suiteRoot, "registry", "capabilities.yaml"), "utf8")) as { capabilities?: unknown[] };
    for (const item of raw.capabilities ?? []) {
      if (!item || typeof item !== "object") { errors.push("Capability registry contains a non-object entry"); continue; }
      const value = item as Partial<CapabilityDescriptor>;
      if (value.schemaVersion !== "1" || typeof value.id !== "string" || typeof value.name !== "string" || typeof value.component !== "string" || typeof value.safety !== "string" || !Array.isArray(value.interfaces)) { errors.push(`Invalid capability descriptor: ${JSON.stringify(item)}`); continue; }
      entries.set(value.id, value as CapabilityDescriptor);
    }
  } catch (error) { errors.push(`Unable to load capability registry: ${String(error)}`); }
  return { entries, errors };
}
