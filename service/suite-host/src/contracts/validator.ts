import path from "node:path";
import { readFile } from "node:fs/promises";
import type { ErrorObject, ValidateFunction } from "ajv";
import type { AventicsManifest, TelemetryEvent } from "../domain/types.js";

interface AjvLike { compile(schema: unknown): ValidateFunction; }
type AjvConstructor = new (options?: Record<string, unknown>) => AjvLike;

export interface ValidationResult<T> {
  valid: boolean;
  value?: T;
  errors: ErrorObject[];
}

export class ContractValidator {
  private constructor(
    private readonly manifestValidator: ValidateFunction,
    private readonly telemetryValidator: ValidateFunction
  ) {}

  static async create(suiteRoot: string): Promise<ContractValidator> {
    const ajvModule = await import("ajv/dist/2020.js");
    const formatsModule = await import("ajv-formats");
    const Ajv2020 = ajvModule.default as unknown as AjvConstructor;
    const addFormats = formatsModule.default as unknown as (ajv: AjvLike) => unknown;
    const ajv = new Ajv2020({ allErrors: true, strict: false });
    addFormats(ajv);
    const [manifestSchema, telemetrySchema] = await Promise.all([
      readJson(path.join(suiteRoot, "contracts", "manifest", "v1", "schema.json")),
      readJson(path.join(suiteRoot, "contracts", "telemetry", "v1", "schema.json"))
    ]);
    return new ContractValidator(ajv.compile(manifestSchema), ajv.compile(telemetrySchema));
  }

  validateManifest(value: unknown): ValidationResult<AventicsManifest> {
    const valid = this.manifestValidator(value);
    return { valid: Boolean(valid), ...(valid ? { value: value as AventicsManifest } : {}), errors: [...(this.manifestValidator.errors ?? [])] };
  }

  validateTelemetry(value: unknown): ValidationResult<TelemetryEvent> {
    const valid = this.telemetryValidator(value);
    return { valid: Boolean(valid), ...(valid ? { value: value as TelemetryEvent } : {}), errors: [...(this.telemetryValidator.errors ?? [])] };
  }
}

async function readJson(filePath: string): Promise<unknown> {
  return JSON.parse(await readFile(filePath, "utf8")) as unknown;
}
