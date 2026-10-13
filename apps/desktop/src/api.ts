import type { SuiteData, ComponentRecord, CapabilityRecord, SkillRecord, McpProviderRecord, Diagnostics, ActivitySummary, ActivityEvent, ReleaseSnapshot, HostSettings, LogRecord } from "./types";
export async function loadSuiteData(): Promise<SuiteData> {
  const [components, capabilities, skills, mcp, diagnostics, activity, recent, release, settings, logs] = await Promise.all([
    window.aventics.request<ComponentRecord[]>("/api/v1/components"),
    window.aventics.request<CapabilityRecord[]>("/api/v1/capabilities"),
    window.aventics.request<SkillRecord[]>("/api/v1/skills"),
    window.aventics.request<McpProviderRecord[]>("/api/v1/mcp"),
    window.aventics.request<Diagnostics>("/api/v1/diagnostics"),
    window.aventics.request<ActivitySummary>("/api/v1/activity/summary"),
    window.aventics.request<ActivityEvent[]>("/api/v1/activity/recent?limit=50"),
    window.aventics.request<ReleaseSnapshot>("/api/v1/release").catch(() => null),
    window.aventics.request<HostSettings>("/api/v1/settings").catch(() => null),
    window.aventics.request<LogRecord[]>("/api/v1/logs/recent?limit=200").catch(() => [])
  ]);
  return { components, capabilities, skills, mcp, diagnostics, activity, recent, release, settings, logs };
}
