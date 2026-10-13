import path from "node:path";
import { appendFile, mkdir, readFile, rename, stat } from "node:fs/promises";
const MAX_LOG_BYTES = 5 * 1024 * 1024;
export interface LogRecord { time: string; level: string; source: string; message: string; data?: unknown; }
export class HostLogger {
  readonly logPath: string; private queue: Promise<void> = Promise.resolve();
  constructor(dataRoot: string) { this.logPath = path.join(dataRoot, "logs", "suite-host.log"); }
  info(message: string, data?: unknown): void { this.write("info", message, data); }
  warn(message: string, data?: unknown): void { this.write("warn", message, data); }
  error(message: string, data?: unknown): void { this.write("error", message, data); }
  async recent(limit = 200): Promise<LogRecord[]> {
    try { const text = await readFile(this.logPath, "utf8"); const rows: LogRecord[] = []; for (const line of text.split(/\r?\n/)) { if (!line.trim()) continue; try { rows.push(JSON.parse(line) as LogRecord); } catch { /* skip */ } } return rows.slice(-Math.max(1, Math.min(1000, limit))).reverse(); }
    catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return []; throw error; }
  }
  private write(level: "info" | "warn" | "error", message: string, data?: unknown): void {
    const record = JSON.stringify({ time: new Date().toISOString(), level, source: "suite-host", message, ...(data === undefined ? {} : { data }) });
    this.queue = this.queue.then(async () => { try { await mkdir(path.dirname(this.logPath), { recursive: true }); await this.rotateIfNeeded(); await appendFile(this.logPath, `${record}\n`, "utf8"); } catch { /* logging cannot block */ } });
    if (process.env.AVENTICS_SUITE_DEV === "1" || level === "error") { const writer = level === "error" ? console.error : level === "warn" ? console.warn : console.log; writer(`[suite-host] ${message}`, data ?? ""); }
  }
  private async rotateIfNeeded(): Promise<void> {
    try { const info = await stat(this.logPath); if (info.size < MAX_LOG_BYTES) return; await rename(this.logPath, `${this.logPath}.1`).catch(async () => { const { rm } = await import("node:fs/promises"); await rm(`${this.logPath}.1`, { force: true }); await rename(this.logPath, `${this.logPath}.1`); }); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
  }
}
