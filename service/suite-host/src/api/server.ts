import Fastify from "fastify";
import type { FastifyInstance } from "fastify";
import type { SuiteHostContext } from "../host-context.js";
import { validBearerToken } from "./auth.js";

export function buildServer(context: SuiteHostContext, token: string): FastifyInstance {
  const app = Fastify({ logger: false, bodyLimit: 64 * 1024, requestTimeout: 10_000 });
  app.addHook("onRequest", async (request, reply) => { if (!request.url.startsWith("/api/v1/")) return; if (!validBearerToken(request.headers.authorization, token)) return reply.code(401).send(apiError("AUTH_REQUIRED", "Valid Suite Host bearer token required")); });
  app.get("/api/v1/status", async () => context.status());
  app.get("/api/v1/components", async () => context.components);
  app.get("/api/v1/components/:id", async (request, reply) => { const { id } = request.params as { id: string }; return context.components.find((item) => item.id === id) ?? reply.code(404).send(apiError("COMPONENT_NOT_FOUND", `Component not found: ${id}`)); });
  app.get("/api/v1/capabilities", async () => context.capabilities);
  app.get("/api/v1/capabilities/:id", async (request, reply) => { const { id } = request.params as { id: string }; return context.capabilities.find((item) => item.id === id) ?? reply.code(404).send(apiError("CAPABILITY_NOT_FOUND", `Capability not found: ${id}`)); });
  app.get("/api/v1/skills", async () => context.skills);
  app.get("/api/v1/mcp", async () => context.mcpProviders);
  app.get("/api/v1/release", async (_request, reply) => context.release ?? reply.code(503).send(apiError("RELEASE_UNAVAILABLE", "Suite release metadata unavailable")));
  app.get("/api/v1/health", async () => context.components.map((component) => ({ component: component.id, runtime: component.runtime, ...component.health })));
  app.get("/api/v1/health/:componentId", async (request, reply) => { const { componentId } = request.params as { componentId: string }; const component = context.components.find((item) => item.id === componentId); return component ? { component: component.id, runtime: component.runtime, ...component.health } : reply.code(404).send(apiError("COMPONENT_NOT_FOUND", `Component not found: ${componentId}`)); });
  app.get("/api/v1/docs", async () => context.components.map((component) => ({ component: component.id, ...component.docs })));
  app.get("/api/v1/docs/:componentId", async (request, reply) => { const { componentId } = request.params as { componentId: string }; const component = context.components.find((item) => item.id === componentId); return component ? { component: component.id, ...component.docs } : reply.code(404).send(apiError("COMPONENT_NOT_FOUND", `Component not found: ${componentId}`)); });
  app.get("/api/v1/activity/recent", async (request, reply) => { try { const raw = Number((request.query as { limit?: string }).limit ?? 50); const limit = Number.isFinite(raw) ? Math.min(200, Math.max(1, Math.floor(raw))) : 50; return await context.activity.recent(limit); } catch (error) { context.logger.warn("Activity read failed", String(error)); return reply.code(503).send(apiError("STORE_UNAVAILABLE", "Activity store unavailable")); } });
  app.get("/api/v1/activity/summary", async (_request, reply) => { try { return await context.activity.summary(); } catch (error) { context.logger.warn("Activity summary failed", String(error)); return reply.code(503).send(apiError("STORE_UNAVAILABLE", "Activity store unavailable")); } });
  app.delete("/api/v1/activity", async (_request, reply) => { try { await context.activity.clear(); return reply.code(204).send(); } catch { return reply.code(503).send(apiError("STORE_UNAVAILABLE", "Activity store unavailable")); } });
  app.get("/api/v1/logs/recent", async (request, reply) => { try { const raw = Number((request.query as { limit?: string }).limit ?? 200); return await context.logger.recent(raw); } catch { return reply.code(503).send(apiError("LOGS_UNAVAILABLE", "Logs unavailable")); } });
  app.get("/api/v1/diagnostics", async () => context.diagnostics);
  app.get("/api/v1/settings", async () => context.settings());
  app.put("/api/v1/settings/activity", async (request, reply) => { const body = request.body as { enabled?: unknown; retentionDays?: unknown }; if (typeof body?.enabled !== "boolean" || typeof body?.retentionDays !== "number") return reply.code(400).send(apiError("INVALID_SETTINGS", "enabled:boolean and retentionDays:number are required")); await context.updateActivitySettings(body.enabled, body.retentionDays); return context.settings(); });
  app.get("/api/v1/search", async (request) => context.search(String((request.query as { q?: string }).q ?? "")));
  app.post("/api/v1/validate/manifest", async (request) => context.validator.validateManifest(request.body));
  app.post("/api/v1/events", async (request, reply) => { try { const result = await context.activity.record(request.body); if (result.errors.length > 0) return reply.code(400).send(apiError("INVALID_EVENT", "Telemetry event rejected", result.errors)); return reply.code(result.stored ? 202 : 204).send(result.stored ? { accepted: true, id: result.stored._id } : undefined); } catch (error) { context.logger.warn("Activity append failed", String(error)); return reply.code(503).send(apiError("STORE_UNAVAILABLE", "Activity store unavailable")); } });
  app.post("/api/v1/rescan", async (_request, reply) => { try { await context.rescan(); return { rescanned: true, ...context.status() }; } catch (error) { context.logger.error("Rescan failed", String(error)); return reply.code(500).send(apiError("RESCAN_FAILED", "Component rescan failed")); } });
  app.setNotFoundHandler(async (_request, reply) => reply.code(404).send(apiError("NOT_FOUND", "Endpoint not found")));
  app.setErrorHandler(async (error: unknown, _request, reply) => { const message = error instanceof Error ? error.message : String(error); context.logger.error("Unhandled API error", { message }); return reply.code(500).send(apiError("INTERNAL_ERROR", "Internal Suite Host error")); });
  return app;
}
function apiError(code: string, message: string, details?: unknown) { return { error: { code, message, ...(details === undefined ? {} : { details }) } }; }
