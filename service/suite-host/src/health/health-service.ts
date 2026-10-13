import { access } from "node:fs/promises";
import type { ComponentHealth, DocsInfo, RuntimeInfo } from "../domain/types.js";

export async function buildComponentHealth(componentRoot: string, docs: DocsInfo, runtime: RuntimeInfo): Promise<ComponentHealth> {
  let rootAccessible = true; try { await access(componentRoot); } catch { rootAccessible = false; }
  const docsCheck = !docs.configured ? { status: "unknown" as const, message: "No docs path declared" } : docs.available ? { status: "healthy" as const } : { status: "degraded" as const, message: docs.reason ?? "Docs unavailable" };
  const runtimeCheck = runtime.state === "running" ? { status: "healthy" as const, message: runtime.message } : { status: "unknown" as const, message: runtime.message };
  const status = !rootAccessible ? "unavailable" : docsCheck.status === "degraded" ? "degraded" : "healthy";
  return { status, checks: { manifest: { status: "healthy" }, componentRoot: rootAccessible ? { status: "healthy" } : { status: "unavailable", message: "Component root is inaccessible" }, docs: docsCheck, runtime: runtimeCheck } };
}
