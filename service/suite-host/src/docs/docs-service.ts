import path from "node:path";
import { access } from "node:fs/promises";
import type { AventicsManifest, DocsInfo } from "../domain/types.js";
import { isPathInside } from "../config/paths.js";

export async function resolveDocs(componentRoot: string, manifest: AventicsManifest): Promise<DocsInfo> {
  const configuredPath = manifest.docs?.path;
  if (!configuredPath) return { configured: false, available: false, path: null, reason: "No docs path declared" };
  const resolved = path.resolve(componentRoot, configuredPath);
  if (!isPathInside(componentRoot, resolved)) return { configured: true, available: false, path: null, reason: "Docs path escapes component root" };
  try {
    await access(resolved);
    return { configured: true, available: true, path: resolved };
  } catch {
    return { configured: true, available: false, path: resolved, reason: "Docs path not found" };
  }
}
