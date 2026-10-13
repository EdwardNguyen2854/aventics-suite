import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { ContractValidator } from "../src/contracts/validator.js";
import { DiscoveryService } from "../src/discovery/discovery-service.js";
import type { HostConfig } from "../src/config/config.js";
import { JsonlActivityStore } from "../src/storage/jsonl-activity-store.js";
import { ActivityService } from "../src/activity/activity-service.js";
import { HostLogger } from "../src/logging/logger.js";
import { SuiteHostContext } from "../src/host-context.js";
import { buildServer } from "../src/api/server.js";

const SUITE_ROOT = path.resolve(process.cwd(), "..", "..");

function manifest(id: string) {
  return {
    schemaVersion: "1",
    id,
    name: id === "aventics.creo" ? "Creo Toolkit" : "Test Component",
    version: "1.0.0",
    type: "extension",
    maturity: "managed",
    host: { type: "test-host" },
    capabilities: [`${id.replace("aventics.", "")}.qc.run`],
    interfaces: { ui: true, mcp: false },
    telemetry: { supported: true },
    docs: { path: "docs" }
  };
}

function config(dataRoot: string, explicitComponents: string[]): HostConfig {
  return {
    dataRoot,
    discovery: { explicitComponents, managedRoots: [], developmentRoots: [], maxDepth: 4 },
    activity: { enabled: true, retentionDays: 90 }
  };
}

async function componentFixture(root: string, name: string, id: string): Promise<string> {
  const componentRoot = path.join(root, name);
  await mkdir(path.join(componentRoot, "docs"), { recursive: true });
  await writeFile(path.join(componentRoot, "aventics.manifest.json"), JSON.stringify(manifest(id)), "utf8");
  return componentRoot;
}

test("Manifest Contract v1 accepts a valid component", async () => {
  const validator = await ContractValidator.create(SUITE_ROOT);
  const result = validator.validateManifest(manifest("aventics.creo"));
  assert.equal(result.valid, true);
  assert.equal(result.value?.id, "aventics.creo");
});

test("discovery isolates invalid manifests and reports duplicate component IDs", async () => {
  const temp = await mkdtemp(path.join(os.tmpdir(), "aventics-host-discovery-"));
  const first = await componentFixture(temp, "a", "aventics.test");
  const second = await componentFixture(temp, "b", "aventics.test");
  const invalid = path.join(temp, "invalid");
  await mkdir(invalid, { recursive: true });
  await writeFile(path.join(invalid, "aventics.manifest.json"), "{bad json", "utf8");
  const validator = await ContractValidator.create(SUITE_ROOT);
  const result = await new DiscoveryService(validator, config(temp, [first, second, invalid])).discover();
  assert.equal(result.components.length, 1);
  assert.equal(result.components[0]?.manifest.id, "aventics.test");
  assert.equal(result.conflicts.length, 1);
  assert.equal(result.failures.length, 1);
});

test("telemetry validates, stores metadata and rejects engineering-content fields", async () => {
  const temp = await mkdtemp(path.join(os.tmpdir(), "aventics-host-activity-"));
  const validator = await ContractValidator.create(SUITE_ROOT);
  const service = new ActivityService(validator, new JsonlActivityStore(temp, 90), true);
  const event = {
    schemaVersion: "1",
    event: "capability.completed",
    timestamp: new Date().toISOString(),
    component: "aventics.creo",
    componentVersion: "1.0.0",
    capability: "creo.qc.run",
    interface: "ui",
    durationMs: 12,
    result: "success"
  };
  const accepted = await service.record(event);
  assert.ok(accepted.stored?._id);
  assert.equal((await service.summary()).total, 1);

  const rejected = await service.record({ ...event, fileName: "customer-part.prt" });
  assert.equal(rejected.stored, null);
  assert.equal(rejected.errors.length, 1);
});

test("local API requires bearer auth and exposes status", async () => {
  const temp = await mkdtemp(path.join(os.tmpdir(), "aventics-host-api-"));
  const validator = await ContractValidator.create(SUITE_ROOT);
  const activity = new ActivityService(validator, new JsonlActivityStore(temp, 90), true);
  const context = new SuiteHostContext("0.1.0", config(temp, []), SUITE_ROOT, validator, activity, new HostLogger(temp));
  const app = buildServer(context, "secret-token");

  const unauthorized = await app.inject({ method: "GET", url: "/api/v1/status" });
  assert.equal(unauthorized.statusCode, 401);

  const authorized = await app.inject({ method: "GET", url: "/api/v1/status", headers: { authorization: "Bearer secret-token" } });
  assert.equal(authorized.statusCode, 200);
  assert.equal(authorized.json().service, "aventics-suite-host");
  await app.close();
});
