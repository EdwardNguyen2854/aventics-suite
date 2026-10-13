import { access } from "node:fs/promises";
import type { ComponentHealth, DocsInfo, HealthCheck, RuntimeInfo } from "../domain/types.js";

export async function buildComponentHealth(componentRoot: string, docs: DocsInfo, runtime: RuntimeInfo): Promise<ComponentHealth> {
  let rootAccessible = true; try { await access(componentRoot); } catch { rootAccessible = false; }
  const docsCheck: HealthCheck = !docs.configured ? { status: "unknown", message: "No docs path declared" } : docs.available ? { status: "healthy" } : { status: "degraded", message: docs.reason ?? "Docs unavailable" };
  const runtimeCheck: HealthCheck = runtime.state === "running" ? { status: "healthy", ...(runtime.message ? { message: runtime.message } : {}) } : { status: "unknown", ...(runtime.message ? { message: runtime.message } : {}) };
  const status = !rootAccessible ? "unavailable" : docsCheck.status === "degraded" ? "degraded" : "healthy";
  return { status, checks: { manifest: { status: "healthy" }, componentRoot: rootAccessible ? { status: "healthy" } : { status: "unavailable", message: "Component root is inaccessible" }, docs: docsCheck, runtime: runtimeCheck } };
}
