import { app, utilityProcess } from "electron";
import { readFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";

interface Rendezvous { pid: number; host: string; port: number; apiVersion: string; token: string; startedAt: string; }
let child: ReturnType<typeof utilityProcess.fork> | null = null;

function dataRoot(): string {
  const local = process.env.LOCALAPPDATA ?? path.join(os.homedir(), "AppData", "Local");
  return process.env.AVENTICS_SUITE_DATA ?? path.join(local, "AventicsSuite");
}
function rendezvousPath(): string { return path.join(dataRoot(), "runtime", "suite-host.json"); }
export function suiteRoot(): string { return app.isPackaged ? path.join(process.resourcesPath, "suite") : path.resolve(app.getAppPath(), "../.."); }
function hostEntry(): string { return app.isPackaged ? path.join(process.resourcesPath, "host", "suite-host.cjs") : path.resolve(app.getAppPath(), "../../service/suite-host/bundle/suite-host.cjs"); }

async function readRendezvous(): Promise<Rendezvous | null> {
  try { return JSON.parse(await readFile(rendezvousPath(), "utf8")) as Rendezvous; } catch { return null; }
}
async function healthy(info: Rendezvous): Promise<boolean> {
  try { const response = await fetch(`http://${info.host}:${info.port}/api/v1/status`, { headers: { Authorization: `Bearer ${info.token}` }, signal: AbortSignal.timeout(1200) }); return response.ok; } catch { return false; }
}
export async function ensureHost(): Promise<Rendezvous> {
  const existing = await readRendezvous(); if (existing && await healthy(existing)) return existing;
  const entry = hostEntry(); child = utilityProcess.fork(entry, [], { env: { ...process.env, AVENTICS_SUITE_ROOT: suiteRoot(), ...(app.isPackaged ? {} : { AVENTICS_SUITE_DEV: "1" }) }, stdio: "pipe", serviceName: "Aventics Suite Host" });
  child.stdout?.on("data", (chunk) => console.log(`[suite-host] ${String(chunk).trim()}`)); child.stderr?.on("data", (chunk) => console.error(`[suite-host] ${String(chunk).trim()}`));
  const deadline = Date.now() + 8000;
  while (Date.now() < deadline) { await new Promise((resolve) => setTimeout(resolve, 200)); const info = await readRendezvous(); if (info && await healthy(info)) return info; }
  throw new Error("Aventics Suite Host did not become ready within 8 seconds");
}
export async function requestHost(apiPath: string, method = "GET", body?: unknown): Promise<unknown> {
  if (!apiPath.startsWith("/api/v1/")) throw new Error("Only Suite Host v1 API paths are allowed");
  const info = await ensureHost(); const response = await fetch(`http://${info.host}:${info.port}${apiPath}`, { method, headers: { Authorization: `Bearer ${info.token}`, ...(body === undefined ? {} : { "Content-Type": "application/json" }) }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(12_000) });
  if (response.status === 204) return null; const text = await response.text(); const payload = text ? JSON.parse(text) : null; if (!response.ok) throw new Error(payload?.error?.message ?? `Suite Host request failed with HTTP ${response.status}`); return payload;
}
export function stopOwnedHost(): void { child?.kill(); child = null; }
