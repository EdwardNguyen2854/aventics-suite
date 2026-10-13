import path from "node:path";
import { readFile } from "node:fs/promises";
import type { ComponentRecord, ReleaseSnapshot } from "../domain/types.js";

interface ReleaseFile { suiteVersion: string; channel: string; releasedAt: string; components: Record<string, string>; }
export async function loadReleaseSnapshot(suiteRoot: string, components: ComponentRecord[]): Promise<{ snapshot: ReleaseSnapshot | null; errors: string[] }> {
  const errors: string[] = [];
  try {
    const raw = JSON.parse(await readFile(path.join(suiteRoot, "registry", "suite-releases", "1.0.0.json"), "utf8")) as ReleaseFile;
    return { snapshot: { suiteVersion: raw.suiteVersion, channel: raw.channel, releasedAt: raw.releasedAt, components: Object.entries(raw.components).map(([component, validatedVersion]) => { const installedVersion = components.find((item) => item.id === component)?.version ?? null; return { component, validatedVersion, installedVersion, status: installedVersion === null ? "missing" : installedVersion === validatedVersion ? "validated" : "different" }; }) }, errors };
  } catch (error) { errors.push(`Unable to load Suite release metadata: ${String(error)}`); return { snapshot: null, errors }; }
}
