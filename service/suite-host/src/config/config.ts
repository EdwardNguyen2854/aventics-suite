import path from "node:path";
import { readFile } from "node:fs/promises";
import { getSuiteDataRoot } from "./paths.js";

export interface HostConfig {
  dataRoot: string;
  discovery: {
    explicitComponents: string[];
    managedRoots: string[];
    developmentRoots: string[];
    maxDepth: number;
  };
  activity: {
    enabled: boolean;
    retentionDays: number;
  };
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

export async function loadConfig(): Promise<HostConfig> {
  const dataRoot = getSuiteDataRoot();
  const isWindows = process.platform === "win32";
  const isDev = process.env.AVENTICS_SUITE_DEV === "1";
  const defaults: HostConfig = {
    dataRoot,
    discovery: {
      explicitComponents: [],
      managedRoots: isWindows ? ["C:\\aventics"] : [],
      developmentRoots: isWindows && isDev ? ["C:\\local\\dev"] : [],
      maxDepth: 4
    },
    activity: { enabled: true, retentionDays: 90 }
  };

  const configPath = path.join(dataRoot, "config", "host.json");
  let raw: Record<string, unknown> = {};
  try {
    raw = JSON.parse(await readFile(configPath, "utf8")) as Record<string, unknown>;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") throw new Error(`Invalid Suite Host config at ${configPath}: ${String(error)}`);
  }

  const discovery = (raw.discovery && typeof raw.discovery === "object" ? raw.discovery : {}) as Record<string, unknown>;
  const activity = (raw.activity && typeof raw.activity === "object" ? raw.activity : {}) as Record<string, unknown>;
  const maxDepth = typeof discovery.maxDepth === "number" ? Math.max(0, Math.min(8, Math.floor(discovery.maxDepth))) : defaults.discovery.maxDepth;

  return {
    dataRoot,
    discovery: {
      explicitComponents: [...normalizePaths(discovery.explicitComponents), ...envRoots("AVENTICS_COMPONENT_PATHS")],
      managedRoots: [...normalizePaths(discovery.managedRoots).length ? normalizePaths(discovery.managedRoots) : defaults.discovery.managedRoots, ...envRoots("AVENTICS_COMPONENT_ROOTS")],
      developmentRoots: [...normalizePaths(discovery.developmentRoots).length ? normalizePaths(discovery.developmentRoots) : defaults.discovery.developmentRoots, ...envRoots("AVENTICS_DEVELOPMENT_ROOTS")],
      maxDepth
    },
    activity: {
      enabled: typeof activity.enabled === "boolean" ? activity.enabled : defaults.activity.enabled,
      retentionDays: typeof activity.retentionDays === "number" ? Math.max(1, Math.floor(activity.retentionDays)) : defaults.activity.retentionDays
    }
  };
}
