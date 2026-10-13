import { randomUUID } from "node:crypto";
import type { ContractValidator } from "../contracts/validator.js";
import type { ActivityStore } from "../storage/activity-store.js";
import type { StoredTelemetryEvent, TelemetryEvent } from "../domain/types.js";

const FORBIDDEN_KEYS = new Set(["customer", "project", "filename", "filepath", "file_path", "workbook", "model", "prompt", "conversation", "drawingdata", "drawing_data", "engineeringvalues", "engineering_values"]);

export class ActivityService {
  constructor(private readonly validator: ContractValidator, private readonly store: ActivityStore, private readonly enabled: boolean) {}

  async record(payload: unknown): Promise<{ stored: StoredTelemetryEvent | null; errors: unknown[] }> {
    if (!this.enabled) return { stored: null, errors: [] };
    const forbidden = findForbiddenKeys(payload);
    if (forbidden.length > 0) return { stored: null, errors: forbidden.map((key) => ({ keyword: "privacy", message: `Forbidden telemetry field: ${key}` })) };
    const validation = this.validator.validateTelemetry(payload);
    if (!validation.valid || !validation.value) return { stored: null, errors: validation.errors };
    const stored: StoredTelemetryEvent = { ...(validation.value as TelemetryEvent), _id: randomUUID(), _receivedAt: new Date().toISOString() };
    await this.store.append(stored);
    return { stored, errors: [] };
  }

  recent(limit: number) { return this.store.recent(limit); }
  summary() { return this.store.summary(); }
}

function findForbiddenKeys(value: unknown): string[] {
  const found = new Set<string>();
  const visit = (current: unknown): void => {
    if (!current || typeof current !== "object") return;
    if (Array.isArray(current)) { for (const item of current) visit(item); return; }
    for (const [key, nested] of Object.entries(current as Record<string, unknown>)) {
      if (FORBIDDEN_KEYS.has(key.toLowerCase())) found.add(key);
      visit(nested);
    }
  };
  visit(value);
  return [...found].sort();
}
