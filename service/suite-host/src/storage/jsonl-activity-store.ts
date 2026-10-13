import path from "node:path";
import { appendFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import type { StoredTelemetryEvent } from "../domain/types.js";
import type { ActivityStore, ActivitySummary } from "./activity-store.js";

export class JsonlActivityStore implements ActivityStore {
  private readonly filePath: string;
  private lastPrune = 0;

  constructor(dataRoot: string, private readonly retentionDays = 90) {
    this.filePath = path.join(dataRoot, "data", "activity.jsonl");
  }

  async append(event: StoredTelemetryEvent): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await this.pruneIfDue();
    await appendFile(this.filePath, `${JSON.stringify(event)}\n`, "utf8");
  }

  async recent(limit: number): Promise<StoredTelemetryEvent[]> {
    const events = await this.readAll();
    return events.slice(-Math.max(1, limit)).reverse();
  }

  async summary(): Promise<ActivitySummary> {
    const events = await this.readAll();
    const result: ActivitySummary = { total: events.length, byComponent: {}, byCapability: {}, byResult: {} };
    for (const event of events) {
      increment(result.byComponent, event.component);
      if (typeof event.capability === "string") increment(result.byCapability, event.capability);
      increment(result.byResult, event.result);
    }
    return result;
  }

  private async pruneIfDue(): Promise<void> {
    const now = Date.now();
    if (now - this.lastPrune < 60 * 60 * 1000) return;
    this.lastPrune = now;
    const events = await this.readAll();
    if (events.length === 0) return;
    const cutoff = now - this.retentionDays * 24 * 60 * 60 * 1000;
    const retained = events.filter((event) => {
      const timestamp = Date.parse(event.timestamp);
      return Number.isFinite(timestamp) && timestamp >= cutoff;
    });
    if (retained.length === events.length) return;
    await mkdir(path.dirname(this.filePath), { recursive: true });
    const temporary = `${this.filePath}.${process.pid}.tmp`;
    await writeFile(temporary, retained.map((event) => JSON.stringify(event)).join("\n") + (retained.length ? "\n" : ""), "utf8");
    await rename(temporary, this.filePath);
  }

  private async readAll(): Promise<StoredTelemetryEvent[]> {
    try {
      const text = await readFile(this.filePath, "utf8");
      const events: StoredTelemetryEvent[] = [];
      for (const line of text.split(/\r?\n/)) {
        if (!line.trim()) continue;
        try { events.push(JSON.parse(line) as StoredTelemetryEvent); } catch { /* tolerate partial/corrupt line */ }
      }
      return events;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw error;
    }
  }
}

function increment(target: Record<string, number>, key: string): void { target[key] = (target[key] ?? 0) + 1; }
