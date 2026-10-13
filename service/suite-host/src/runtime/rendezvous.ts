import path from "node:path";
import { mkdir, rename, writeFile } from "node:fs/promises";
import type { RendezvousRecord } from "./single-instance.js";

export async function writeRendezvous(runtimePath: string, record: RendezvousRecord): Promise<void> {
  await mkdir(path.dirname(runtimePath), { recursive: true });
  const temporary = `${runtimePath}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(record, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  await rename(temporary, runtimePath);
}
