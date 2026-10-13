import path from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { getSuiteDataRoot } from "./paths.js";

export interface HostConfig {
  dataRoot: string;
  discovery: { explicitComponents: string[]; managedRoots: string[]; developmentRoots: string[]; maxDepth: number; };
  activity: { enabled: boolean; retentionDays: number; };
  mcp: { endpoints: Record<string, string>; };
}

function normalizePaths(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.filter((v): v is string => typeof v === "string" && v.trim().length > 0).map((v) => path.resolve(v)))];
}
function envRoots(name: string): string[] {
  const value = process.env[name];
  if (!value) return [];
  return value.split(path.delimiter).map((entry) => entry.trim()).filter(Boolean).map((entry) => path.resolve(entry));
}
function stringMap(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].trim().length > 0));
}

export async function loadConfig(): Promise<HostConfig> {
  const dataRoot = getSuiteDataRoot();
  const isWindows = process.platform === "win32";
  const isDev = process.env.AVENTICS_SUITE_DEV === "1";
  const defaults: HostConfig = {
    dataRoot,
    discovery: { explicitComponents: [], managedRoots: isWindows ? ["C:\\aventics"] : [], developmentRoots: isWindows && isDev ? ["C:\\local\\dev"] : [], maxDepth: 4 },
    activity: { enabled: true, retentionDays: 90 },
    mcp: { endpoints: {} }
  };

  const configPath = path.join(dataRoot, "config", "host.json");
  let raw: Record<string, unknown> = {};
  try {
    const text = await readFile(configPath, "utf8");
    try { raw = JSON.parse(text) as Record<string, unknown>; }
    catch (error) { process.stderr.write(`[suite-host] Ignoring invalid config ${configPath}: ${String(error)}\n`); }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw new Error(`Unable to read Suite Host config at ${configPath}: ${String(error)}`);
  }

  const discovery = (raw.discovery && typeof raw.discovery === "object" ? raw.discovery : {}) as Record<string, unknown>;
  const activity = (raw.activity && typeof raw.activity === "object" ? raw.activity : {}) as Record<string, unknown>;
  const mcp = (raw.mcp && typeof raw.mcp === "object" ? raw.mcp : {}) as Record<string, unknown>;
  const maxDepth = typeof discovery.maxDepth === "number" ? Math.max(0, Math.min(8, Math.floor(discovery.maxDepth))) : defaults.discovery.maxDepth;
  const configuredManaged = normalizePaths(discovery.managedRoots);
  const configuredDevelopment = normalizePaths(discovery.developmentRoots);
  return {
    dataRoot,
    discovery: {
      explicitComponents: [...new Set([...normalizePaths(discovery.explicitComponents), ...envRoots("AVENTICS_COMPONENT_PATHS")])],
      managedRoots: [...new Set([...(configuredManaged.length > 0 ? configuredManaged : defaults.discovery.managedRoots), ...envRoots("AVENTICS_COMPONENT_ROOTS")])],
      developmentRoots: [...new Set([...(configuredDevelopment.length > 0 ? configuredDevelopment : defaults.discovery.developmentRoots), ...envRoots("AVENTICS_DEVELOPMENT_ROOTS")])],
      maxDepth
    },
    activity: {
      enabled: typeof activity.enabled === "boolean" ? activity.enabled : defaults.activity.enabled,
      retentionDays: typeof activity.retentionDays === "number" ? Math.max(1, Math.min(3650, Math.floor(activity.retentionDays))) : defaults.activity.retentionDays
    },
    mcp: { endpoints: stringMap(mcp.endpoints) }
  };
}

export async function persistActivityConfig(dataRoot: string, enabled: boolean, retentionDays: number): Promise<void> {
  const configPath = path.join(dataRoot, "config", "host.json");
  let current: Record<string, unknown> = {};
  try { current = JSON.parse(await readFile(configPath, "utf8")) as Record<string, unknown>; } catch { current = {}; }
  current.activity = { enabled, retentionDays };
  await mkdir(path.dirname(configPath), { recursive: true });
  await writeFile(configPath, `${JSON.stringify(current, null, 2)}\n`, "utf8");
}
