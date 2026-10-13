import path from "node:path";
import { appendFile, mkdir, readFile } from "node:fs/promises";
import type { StoredTelemetryEvent } from "../domain/types.js";
import type { ActivityStore, ActivitySummary } from "./activity-store.js";

export class JsonlActivityStore implements ActivityStore {
  private readonly filePath: string;
  constructor(dataRoot: string) { this.filePath = path.join(dataRoot, "data", "activity.jsonl"); }

  async append(event: StoredTelemetryEvent): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
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
