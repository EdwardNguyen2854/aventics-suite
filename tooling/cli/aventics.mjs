#!/usr/bin/env node
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const command = process.argv[2] ?? "help";
const args = process.argv.slice(3);
const json = args.includes("--json");
const localAppData = process.env.LOCALAPPDATA ?? path.join(os.homedir(), "AppData", "Local");
const runtimePath = path.join(process.env.AVENTICS_SUITE_DATA ?? path.join(localAppData, "AventicsSuite"), "runtime", "suite-host.json");

async function host() { try { return JSON.parse(await fs.readFile(runtimePath, "utf8")); } catch { throw new Error(`Suite Host rendezvous not found at ${runtimePath}. Start Aventics Suite first.`); } }
async function request(apiPath, method="GET", body) { const info=await host(); const response=await fetch(`http://${info.host}:${info.port}${apiPath}`,{method,headers:{Authorization:`Bearer ${info.token}`,...(body===undefined?{}:{"Content-Type":"application/json"})},body:body===undefined?undefined:JSON.stringify(body)}); const text=await response.text(); const payload=text?JSON.parse(text):null; if(!response.ok) throw new Error(payload?.error?.message??`HTTP ${response.status}`); return payload; }
function output(value) { if(json || typeof value!=="string") console.log(JSON.stringify(value,null,2)); else console.log(value); }
async function main(){
  switch(command){
    case "status": output(await request("/api/v1/status")); break;
    case "doctor": output(await request("/api/v1/diagnostics")); break;
    case "components": output(await request("/api/v1/components")); break;
    case "capabilities": output(await request("/api/v1/capabilities")); break;
    case "skills": output(await request("/api/v1/skills")); break;
    case "mcp": output(await request("/api/v1/mcp")); break;
    case "rescan": output(await request("/api/v1/rescan","POST")); break;
    case "validate": { const manifestPath=args.find(a=>!a.startsWith("--")); if(!manifestPath) throw new Error("Usage: aventics validate <aventics.manifest.json>"); const manifest=JSON.parse(await fs.readFile(path.resolve(manifestPath),"utf8")); output(await request("/api/v1/validate/manifest","POST",manifest)); break; }
    default: console.log(`Aventics CLI 1.0\n\nCommands:\n  status\n  doctor\n  components\n  capabilities\n  skills\n  mcp\n  rescan\n  validate <manifest>\n\nAdd --json for machine-readable output.`);
  }
}
main().catch(error=>{console.error(`aventics: ${error.message??String(error)}`);process.exitCode=1;});
