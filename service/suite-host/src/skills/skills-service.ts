import path from "node:path";
import { access, readdir, readFile } from "node:fs/promises";
import type { SkillRecord } from "../domain/types.js";

interface SkillMetadata { schemaVersion?: string; id?: string; name?: string; description?: string; requires?: unknown; optional?: unknown; }
export async function discoverSkills(suiteRoot: string, availableCapabilities: Set<string>): Promise<SkillRecord[]> {
  const root = path.join(suiteRoot, "skills"); let directories; try { directories = await readdir(root, { withFileTypes: true }); } catch { return []; }
  const records: SkillRecord[] = [];
  for (const directory of directories) {
    if (!directory.isDirectory()) continue;
    const folder = path.join(root, directory.name); const metadataPath = path.join(folder, "skill.json"); const skillPath = path.join(folder, "SKILL.md"); const errors: string[] = [];
    let metadata: SkillMetadata = {};
    try { metadata = JSON.parse(await readFile(metadataPath, "utf8")) as SkillMetadata; } catch { errors.push("Missing or invalid skill.json"); }
    try { await access(skillPath); } catch { errors.push("Missing SKILL.md"); }
    const requires = asStrings(metadata.requires); const optional = asStrings(metadata.optional); const missingCapabilities = requires.filter((id) => !availableCapabilities.has(id));
    if (missingCapabilities.length > 0) errors.push(`Missing required capabilities: ${missingCapabilities.join(", ")}`);
    const validMetadata = metadata.schemaVersion === "1" && typeof metadata.id === "string" && typeof metadata.name === "string" && typeof metadata.description === "string";
    if (!validMetadata) errors.push("Skill metadata does not satisfy v1 requirements");
    records.push({ id: metadata.id ?? `invalid.${directory.name}`, name: metadata.name ?? directory.name, description: metadata.description ?? "Invalid skill metadata", path: skillPath, requires, optional, status: !validMetadata || errors.some((error) => error.startsWith("Missing SKILL")) ? "invalid" : missingCapabilities.length > 0 ? "degraded" : "ready", missingCapabilities, errors });
  }
  return records.sort((a, b) => a.name.localeCompare(b.name));
}
function asStrings(value: unknown): string[] { return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []; }
