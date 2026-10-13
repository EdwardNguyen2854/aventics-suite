import os from "node:os";
import path from "node:path";
import { access } from "node:fs/promises";

async function exists(target: string): Promise<boolean> {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

export function getSuiteDataRoot(): string {
  const override = process.env.AVENTICS_SUITE_DATA;
  if (override) return path.resolve(override);

  if (process.platform === "win32") {
    const localAppData = process.env.LOCALAPPDATA ?? path.join(os.homedir(), "AppData", "Local");
    return path.join(localAppData, "AventicsSuite");
  }

  return path.join(process.env.XDG_DATA_HOME ?? path.join(os.homedir(), ".local", "share"), "AventicsSuite");
}

export async function findSuiteRoot(start = process.cwd()): Promise<string> {
  const override = process.env.AVENTICS_SUITE_ROOT;
  if (override) return path.resolve(override);

  let current = path.resolve(start);
  for (let depth = 0; depth < 10; depth += 1) {
    const manifestSchema = path.join(current, "contracts", "manifest", "v1", "schema.json");
    const registry = path.join(current, "registry", "components.yaml");
    if (await exists(manifestSchema) && await exists(registry)) return current;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  throw new Error("Unable to locate Aventics Suite root. Set AVENTICS_SUITE_ROOT.");
}

export function isPathInside(parent: string, candidate: string): boolean {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}
