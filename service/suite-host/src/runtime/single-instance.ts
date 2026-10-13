import path from "node:path";
import { mkdir, open, readFile, rm } from "node:fs/promises";
import type { FileHandle } from "node:fs/promises";

export interface RendezvousRecord {
  pid: number;
  host: "127.0.0.1";
  port: number;
  apiVersion: "1";
  token: string;
  startedAt: string;
}

export interface SingleInstanceLease {
  lockHandle: FileHandle;
  lockPath: string;
  runtimePath: string;
}

export function isProcessAlive(pid: number): boolean {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export async function readRendezvous(runtimePath: string): Promise<RendezvousRecord | null> {
  try {
    const parsed = JSON.parse(await readFile(runtimePath, "utf8")) as Partial<RendezvousRecord>;
    if (typeof parsed.pid !== "number" || typeof parsed.port !== "number" || typeof parsed.token !== "string") return null;
    return parsed as RendezvousRecord;
  } catch {
    return null;
  }
}

export async function acquireSingleInstance(dataRoot: string): Promise<{ lease: SingleInstanceLease | null; existing: RendezvousRecord | null }> {
  const runtimeDir = path.join(dataRoot, "runtime");
  const lockPath = path.join(runtimeDir, "suite-host.lock");
  const runtimePath = path.join(runtimeDir, "suite-host.json");
  await mkdir(runtimeDir, { recursive: true });

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const lockHandle = await open(lockPath, "wx", 0o600);
      return { lease: { lockHandle, lockPath, runtimePath }, existing: null };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      const existing = await readRendezvous(runtimePath);
      if (existing && isProcessAlive(existing.pid)) return { lease: null, existing };
      await rm(lockPath, { force: true });
      await rm(runtimePath, { force: true });
    }
  }

  throw new Error("Unable to acquire Suite Host single-instance lock");
}

export async function releaseSingleInstance(lease: SingleInstanceLease): Promise<void> {
  try { await lease.lockHandle.close(); } catch { /* best effort */ }
  await rm(lease.runtimePath, { force: true }).catch(() => undefined);
  await rm(lease.lockPath, { force: true }).catch(() => undefined);
}
