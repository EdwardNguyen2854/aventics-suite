import path from "node:path";
import { readFile } from "node:fs/promises";
import { parse as parseYaml } from "yaml";
import type { RegistryEntry } from "../domain/types.js";

export interface RegistryLoadResult {
  entries: Map<string, RegistryEntry>;
  errors: string[];
}

export async function loadSuiteRegistry(suiteRoot: string): Promise<RegistryLoadResult> {
  const registryPath = path.join(suiteRoot, "registry", "components.yaml");
  try {
    const parsed = parseYaml(await readFile(registryPath, "utf8")) as unknown;
    if (!parsed || typeof parsed !== "object") return { entries: new Map(), errors: ["Registry root must be an object"] };
    const components = (parsed as { components?: unknown }).components;
    if (!Array.isArray(components)) return { entries: new Map(), errors: ["Registry components must be an array"] };

    const entries = new Map<string, RegistryEntry>();
    const errors: string[] = [];
    for (const item of components) {
      if (!item || typeof item !== "object" || typeof (item as { id?: unknown }).id !== "string") {
        errors.push("Registry entry is missing a string id");
        continue;
      }
      const entry = item as RegistryEntry;
      if (entries.has(entry.id)) errors.push(`Duplicate registry entry: ${entry.id}`);
      entries.set(entry.id, entry);
    }
    return { entries, errors };
  } catch (error) {
    return { entries: new Map(), errors: [`Unable to load Suite registry: ${String(error)}`] };
  }
}
