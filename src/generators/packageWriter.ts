import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

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
