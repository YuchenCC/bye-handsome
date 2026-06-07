import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { ZodSchema } from "zod";
import { validatePackageArtifact } from "../model/packageSchemas.js";

export async function writePackageFile(
  root: string,
  relativePath: string,
  content: string
): Promise<void> {
  const outputPath = join(root, relativePath);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, content, "utf8");
}

export async function writePackageJson(
  root: string,
  relativePath: string,
  value: unknown
): Promise<void> {
  await writePackageFile(root, relativePath, `${JSON.stringify(value, null, 2)}\n`);
}

export async function writeValidatedPackageJson<T>(
  root: string,
  relativePath: string,
  value: unknown,
  schema: ZodSchema<T>
): Promise<T> {
  const parsed = validatePackageArtifact(relativePath, value, schema);
  await writePackageJson(root, relativePath, parsed);
  return parsed;
}
