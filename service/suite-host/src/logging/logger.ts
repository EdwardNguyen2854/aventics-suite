import path from "node:path";
import { appendFile, mkdir } from "node:fs/promises";

export class HostLogger {
  private readonly logPath: string;

  constructor(dataRoot: string) {
    this.logPath = path.join(dataRoot, "logs", "suite-host.log");
  }

  info(message: string, data?: unknown): void { this.write("info", message, data); }
  warn(message: string, data?: unknown): void { this.write("warn", message, data); }
  error(message: string, data?: unknown): void { this.write("error", message, data); }

  private write(level: "info" | "warn" | "error", message: string, data?: unknown): void {
    const record = JSON.stringify({ time: new Date().toISOString(), level, source: "suite-host", message, ...(data === undefined ? {} : { data }) });
    void (async () => {
      try {
        await mkdir(path.dirname(this.logPath), { recursive: true });
        await appendFile(this.logPath, `${record}\n`, "utf8");
      } catch {
        // Logging must never become a runtime dependency.
      }
    })();

    if (process.env.AVENTICS_SUITE_DEV === "1" || level === "error") {
      const writer = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
      writer(`[suite-host] ${message}`, data ?? "");
    }
  }
}
