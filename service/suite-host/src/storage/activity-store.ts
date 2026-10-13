import type { StoredTelemetryEvent } from "../domain/types.js";

export interface ActivitySummary {
  total: number;
  byComponent: Record<string, number>;
  byCapability: Record<string, number>;
  byResult: Record<string, number>;
}

export interface ActivityStore {
  append(event: StoredTelemetryEvent): Promise<void>;
  recent(limit: number): Promise<StoredTelemetryEvent[]>;
  summary(): Promise<ActivitySummary>;
}
