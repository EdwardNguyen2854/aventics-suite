import { randomBytes } from "node:crypto";
import { loadConfig } from "./config/config.js";
import { findSuiteRoot } from "./config/paths.js";
import { HostLogger } from "./logging/logger.js";
import { ContractValidator } from "./contracts/validator.js";
import { JsonlActivityStore } from "./storage/jsonl-activity-store.js";
import { ActivityService } from "./activity/activity-service.js";
import { SuiteHostContext } from "./host-context.js";
import { buildServer } from "./api/server.js";
import { acquireSingleInstance, releaseSingleInstance } from "./runtime/single-instance.js";
import { writeRendezvous } from "./runtime/rendezvous.js";
const VERSION = "1.0.0";
async function main(): Promise<void> {
  const config = await loadConfig(); const logger = new HostLogger(config.dataRoot); const acquired = await acquireSingleInstance(config.dataRoot);
  if (acquired.existing) { console.log(`Aventics Suite Host is already running at http://${acquired.existing.host}:${acquired.existing.port}`); return; }
  if (!acquired.lease) throw new Error("Suite Host lease was not acquired");
  const lease = acquired.lease; let server: ReturnType<typeof buildServer> | null = null; let cleanedUp = false;
  const cleanup = async (): Promise<void> => { if (cleanedUp) return; cleanedUp = true; if (server) await server.close().catch(() => undefined); await releaseSingleInstance(lease); };
  try {
    const suiteRoot = await findSuiteRoot(); const validator = await ContractValidator.create(suiteRoot); const activityStore = new JsonlActivityStore(config.dataRoot, config.activity.retentionDays); const activity = new ActivityService(validator, activityStore, config.activity.enabled); const context = new SuiteHostContext(VERSION, config, suiteRoot, validator, activity, logger); await context.rescan();
    const token = randomBytes(32).toString("base64url"); server = buildServer(context, token); await server.listen({ host: "127.0.0.1", port: 0 }); const address = server.server.address(); if (!address || typeof address === "string") throw new Error("Unable to determine Suite Host listening port");
    await writeRendezvous(lease.runtimePath, { pid: process.pid, host: "127.0.0.1", port: address.port, apiVersion: "1", token, startedAt: new Date().toISOString() }); logger.info("Suite Host started", { port: address.port, components: context.components.length }); console.log(`Aventics Suite Host v${VERSION} listening on 127.0.0.1:${address.port}`);
    const shutdown = (signal: string): void => { logger.info("Suite Host stopping", { signal }); void cleanup().finally(() => process.exit(0)); }; process.once("SIGINT", () => shutdown("SIGINT")); process.once("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) { logger.error("Suite Host startup failed", String(error)); await cleanup(); throw error; }
}
main().catch((error) => { console.error("Aventics Suite Host failed:", error); process.exitCode = 1; });
