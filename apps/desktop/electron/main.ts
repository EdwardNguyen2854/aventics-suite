import { app, BrowserWindow, ipcMain, shell } from "electron";
import { autoUpdater } from "electron-updater";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ensureHost, requestHost, stopOwnedHost, suiteRoot } from "./host-manager.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let mainWindow: BrowserWindow | null = null;
const initialMode = process.argv.includes("--developer") ? "developer" : "user";

async function createWindow(): Promise<void> {
  await ensureHost();
  mainWindow = new BrowserWindow({ width: 1440, height: 920, minWidth: 1080, minHeight: 700, show: false, backgroundColor: "#f5f7f9", webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, nodeIntegration: false, sandbox: true } });
  mainWindow.once("ready-to-show", () => mainWindow?.show());
  await mainWindow.loadFile(path.join(__dirname, "../dist/index.html"), { query: { mode: initialMode } });
}

ipcMain.handle("suite:request", async (_event, input: { path: string; method?: string; body?: unknown }) => requestHost(input.path, input.method ?? "GET", input.body));
ipcMain.handle("suite:openDocs", async (_event, componentId: string) => { const docs = await requestHost(`/api/v1/docs/${encodeURIComponent(componentId)}`) as { available?: boolean; path?: string | null }; if (!docs.available || !docs.path) throw new Error("Component documentation is unavailable"); const error = await shell.openPath(docs.path); if (error) throw new Error(error); return true; });
ipcMain.handle("suite:readDoc", async (_event, relativePath: string) => { if (!/^[a-zA-Z0-9_./-]+\.md$/.test(relativePath)) throw new Error("Invalid documentation path"); const root = path.join(suiteRoot(), "docs"); const target = path.resolve(root, relativePath); const relative = path.relative(root, target); if (relative.startsWith("..") || path.isAbsolute(relative)) throw new Error("Documentation path escapes Suite docs root"); return readFile(target, "utf8"); });
ipcMain.handle("suite:version", () => app.getVersion());
ipcMain.handle("suite:mode", () => initialMode);
ipcMain.handle("suite:updateCheck", async () => { const url = process.env.AVENTICS_SUITE_UPDATE_URL; if (!url) return { enabled: false, status: "not-configured" }; autoUpdater.autoDownload = false; autoUpdater.setFeedURL({ provider: "generic", url }); const result = await autoUpdater.checkForUpdates(); return { enabled: true, status: result?.updateInfo?.version && result.updateInfo.version !== app.getVersion() ? "available" : "current", currentVersion: app.getVersion(), availableVersion: result?.updateInfo?.version ?? null }; });

app.whenReady().then(createWindow).catch((error) => { console.error(error); app.quit(); });
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
app.on("before-quit", () => stopOwnedHost());
app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) void createWindow(); });
