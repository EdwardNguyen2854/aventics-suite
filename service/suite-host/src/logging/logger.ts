import path from "node:path";
import { appendFile, mkdir, rename, stat } from "node:fs/promises";

const MAX_LOG_BYTES = 5 * 1024 * 1024;

export class HostLogger {
  private readonly logPath: string;
  private queue: Promise<void> = Promise.resolve();

  constructor(dataRoot: string) {
    this.logPath = path.join(dataRoot, "logs", "suite-host.log");
  }

  info(message: string, data?: unknown): void { this.write("info", message, data); }
  warn(message: string, data?: unknown): void { this.write("warn", message, data); }
  error(message: string, data?: unknown): void { this.write("error", message, data); }

  private write(level: "info" | "warn" | "error", message: string, data?: unknown): void {
    const record = JSON.stringify({ time: new Date().toISOString(), level, source: "suite-host", message, ...(data === undefined ? {} : { data }) });
    this.queue = this.queue.then(async () => {
      try {
        await mkdir(path.dirname(this.logPath), { recursive: true });
        await this.rotateIfNeeded();
        await appendFile(this.logPath, `${record}\n`, "utf8");
      } catch {
        // Logging must never become a runtime dependency.
      }
    });

    if (process.env.AVENTICS_SUITE_DEV === "1" || level === "error") {
      const writer = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
      writer(`[suite-host] ${message}`, data ?? "");
    }
  }

  private async rotateIfNeeded(): Promise<void> {
    try {
      const info = await stat(this.logPath);
      if (info.size < MAX_LOG_BYTES) return;
      await rename(this.logPath, `${this.logPath}.1`).catch(async () => {
        // If a previous rotated file exists, overwrite behavior varies by platform.
        const { rm } = await import("node:fs/promises");
        await rm(`${this.logPath}.1`, { force: true });
        await rename(this.logPath, `${this.logPath}.1`);
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
}
