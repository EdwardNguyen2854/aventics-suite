import { execFile } from "node:child_process";
import type { RegistryEntry, RuntimeInfo } from "../domain/types.js";

export async function getRunningProcessNames(): Promise<Set<string>> {
  if (process.platform !== "win32") return new Set();
  const output = await new Promise<string>((resolve) => {
    execFile("tasklist", ["/FO", "CSV", "/NH"], { windowsHide: true, timeout: 3000 }, (error, stdout) => resolve(error ? "" : stdout));
  });
  const names = new Set<string>();
  for (const line of output.split(/\r?\n/)) { const match = /^"([^"]+)"/.exec(line.trim()); if (match?.[1]) names.add(match[1].toLowerCase()); }
  return names;
}

export function resolveRuntime(entry: RegistryEntry | undefined, running: Set<string>): RuntimeInfo {
  const processNames = (entry?.runtime?.processNames ?? []).filter((value): value is string => typeof value === "string" && value.length > 0);
  if (processNames.length === 0) return { state: "unknown", processNames: [], message: "No runtime process detector configured" };
  if (process.platform !== "win32") return { state: "unknown", processNames, message: "Process detection is currently supported on Windows" };
  const active = processNames.some((name) => running.has(name.toLowerCase()));
  return { state: active ? "running" : "stopped", processNames, message: active ? "Runtime process detected" : "Installed but runtime is not currently running" };
}
