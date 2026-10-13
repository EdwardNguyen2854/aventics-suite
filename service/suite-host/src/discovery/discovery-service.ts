import path from "node:path";
import { readdir, readFile, stat } from "node:fs/promises";
import type { ContractValidator } from "../contracts/validator.js";
import type { AventicsManifest, DiscoveredComponent, DiscoveryConflict, DiscoveryFailure, DiscoverySource } from "../domain/types.js";
import type { HostConfig } from "../config/config.js";

const MANIFEST_NAME = "aventics.manifest.json";
const MAX_MANIFEST_BYTES = 256 * 1024;
const EXCLUDED_DIRS = new Set([".git", "node_modules", "dist", "build", "out", "release", ".cache"]);
const PRECEDENCE: Record<DiscoverySource, number> = { explicit: 300, managed: 200, development: 100 };

interface CandidatePath { manifestPath: string; source: DiscoverySource; }

export interface DiscoveryResult {
  components: DiscoveredComponent[];
  failures: DiscoveryFailure[];
  conflicts: DiscoveryConflict[];
}

export class DiscoveryService {
  constructor(private readonly validator: ContractValidator, private readonly config: HostConfig) {}

  async discover(): Promise<DiscoveryResult> {
    const candidates = new Map<string, CandidatePath>();
    for (const root of this.config.discovery.explicitComponents) {
      candidates.set(path.join(root, MANIFEST_NAME), { manifestPath: path.join(root, MANIFEST_NAME), source: "explicit" });
    }
    await this.collectRoots(this.config.discovery.managedRoots, "managed", candidates);
    await this.collectRoots(this.config.discovery.developmentRoots, "development", candidates);

    const valid: DiscoveredComponent[] = [];
    const failures: DiscoveryFailure[] = [];
    for (const candidate of [...candidates.values()].sort((a, b) => a.manifestPath.localeCompare(b.manifestPath))) {
      const loaded = await this.loadCandidate(candidate);
      if ("failure" in loaded) failures.push(loaded.failure);
      else valid.push(loaded.component);
    }

    const grouped = new Map<string, DiscoveredComponent[]>();
    for (const component of valid) {
      const list = grouped.get(component.manifest.id) ?? [];
      list.push(component);
      grouped.set(component.manifest.id, list);
    }

    const components: DiscoveredComponent[] = [];
    const conflicts: DiscoveryConflict[] = [];
    for (const [id, matches] of grouped) {
      matches.sort((a, b) => b.precedence - a.precedence || a.manifestPath.localeCompare(b.manifestPath));
      const selected = matches[0];
      if (!selected) continue;
      components.push(selected);
      if (matches.length > 1) conflicts.push({ id, selectedPath: selected.manifestPath, paths: matches.map((m) => m.manifestPath) });
    }

    components.sort((a, b) => a.manifest.id.localeCompare(b.manifest.id));
    return { components, failures, conflicts };
  }

  private async collectRoots(roots: string[], source: DiscoverySource, output: Map<string, CandidatePath>): Promise<void> {
    for (const root of roots) {
      for (const manifestPath of await findManifests(root, this.config.discovery.maxDepth)) {
        const existing = output.get(manifestPath);
        if (!existing || PRECEDENCE[source] > PRECEDENCE[existing.source]) output.set(manifestPath, { manifestPath, source });
      }
    }
  }

  private async loadCandidate(candidate: CandidatePath): Promise<{ component: DiscoveredComponent } | { failure: DiscoveryFailure }> {
    try {
      const info = await stat(candidate.manifestPath);
      if (!info.isFile() || info.size > MAX_MANIFEST_BYTES) {
        return { failure: { manifestPath: candidate.manifestPath, source: candidate.source, code: "MANIFEST_UNREADABLE", message: "Manifest is not a regular file or exceeds 256 KiB" } };
      }
      const parsed = JSON.parse(await readFile(candidate.manifestPath, "utf8")) as unknown;
      const schemaVersion = parsed && typeof parsed === "object" ? (parsed as { schemaVersion?: unknown }).schemaVersion : undefined;
      if (schemaVersion !== "1") {
        return { failure: { manifestPath: candidate.manifestPath, source: candidate.source, code: "SCHEMA_UNSUPPORTED", message: `Unsupported manifest schemaVersion: ${String(schemaVersion)}` } };
      }
      const validation = this.validator.validateManifest(parsed);
      if (!validation.valid || !validation.value) {
        return { failure: { manifestPath: candidate.manifestPath, source: candidate.source, code: "MANIFEST_INVALID", message: "Manifest failed Contract v1 validation", details: validation.errors } };
      }
      return { component: { manifest: validation.value, componentRoot: path.dirname(candidate.manifestPath), manifestPath: candidate.manifestPath, source: candidate.source, precedence: PRECEDENCE[candidate.source] } };
    } catch (error) {
      return { failure: { manifestPath: candidate.manifestPath, source: candidate.source, code: "MANIFEST_UNREADABLE", message: String(error) } };
    }
  }
}

async function findManifests(root: string, maxDepth: number): Promise<string[]> {
  const results: string[] = [];
  async function walk(directory: string, depth: number): Promise<void> {
    if (depth > maxDepth) return;
    let entries;
    try { entries = await readdir(directory, { withFileTypes: true }); } catch { return; }
    if (entries.some((entry) => entry.isFile() && entry.name === MANIFEST_NAME)) results.push(path.join(directory, MANIFEST_NAME));
    if (depth === maxDepth) return;
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.isSymbolicLink() || EXCLUDED_DIRS.has(entry.name)) continue;
      await walk(path.join(directory, entry.name), depth + 1);
    }
  }
  await walk(path.resolve(root), 0);
  return results;
}

export const discoveryInternals = { findManifests };
