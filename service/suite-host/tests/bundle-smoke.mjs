import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const suiteRoot = path.resolve(process.cwd(), "..", "..");
const dataRoot = await mkdtemp(path.join(os.tmpdir(), "aventics-suite-host-bundle-"));
const entry = path.resolve(process.cwd(), "bundle", "suite-host.cjs");
const rendezvous = path.join(dataRoot, "runtime", "suite-host.json");
const child = spawn(process.execPath, [entry], {
  cwd: process.cwd(),
  env: { ...process.env, AVENTICS_SUITE_ROOT: suiteRoot, AVENTICS_SUITE_DATA: dataRoot, AVENTICS_SUITE_DEV: "0" },
  stdio: ["ignore", "pipe", "pipe"],
  windowsHide: true
});
let stderr = "";
child.stderr.on("data", (chunk) => { stderr += String(chunk); });
async function waitForHost() {
  const deadline = Date.now() + 8000;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 150));
    try {
      const info = JSON.parse(await readFile(rendezvous, "utf8"));
      const response = await fetch(`http://${info.host}:${info.port}/api/v1/status`, { headers: { Authorization: `Bearer ${info.token}` }, signal: AbortSignal.timeout(1000) });
      if (response.ok) return await response.json();
    } catch { /* Host is still starting. */ }
  }
  throw new Error(`Bundled Suite Host failed to start. ${stderr}`);
}
try {
  const status = await waitForHost();
  if (status.service !== "aventics-suite-host" || status.version !== "1.0.0") throw new Error(`Unexpected bundled Host status: ${JSON.stringify(status)}`);
  console.log(`Bundled Suite Host smoke test passed on port ${status.port ?? "dynamic"}.`);
} finally {
  child.kill();
  await new Promise((resolve) => setTimeout(resolve, 250));
  await rm(dataRoot, { recursive: true, force: true });
}
