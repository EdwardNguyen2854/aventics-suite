import { access } from "node:fs/promises";
import type { ComponentHealth, DocsInfo } from "../domain/types.js";

export async function buildComponentHealth(componentRoot: string, docs: DocsInfo): Promise<ComponentHealth> {
  let rootAccessible = true;
  try { await access(componentRoot); } catch { rootAccessible = false; }

  const docsCheck = !docs.configured
    ? { status: "unknown" as const, message: "No docs path declared" }
    : docs.available
      ? { status: "healthy" as const }
      : { status: "degraded" as const, message: docs.reason ?? "Docs unavailable" };

  const status = !rootAccessible ? "unavailable" : docsCheck.status === "degraded" ? "degraded" : "healthy";
  return {
    status,
    checks: {
      manifest: { status: "healthy" },
      componentRoot: rootAccessible ? { status: "healthy" } : { status: "unavailable", message: "Component root is inaccessible" },
      docs: docsCheck,
      runtime: { status: "unknown", message: "Runtime health provider not implemented in v0.1" }
    }
  };
}
