import AdmZip from "adm-zip";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import type { WorkspaceInput } from "./types.js";

export async function prepareWorkspace(inputPath: string): Promise<WorkspaceInput> {
  const sourcePath = resolve(inputPath);
  const info = await stat(sourcePath);

  if (info.isDirectory()) {
    return {
      sourcePath,
      workspacePath: sourcePath,
      cleanup: async () => undefined
    };
  }

  if (!info.isFile() || !sourcePath.toLowerCase().endsWith(".zip")) {
    throw new Error(`Input must be a directory or .zip file: ${sourcePath}`);
  }

  const workspacePath = await mkdtemp(join(tmpdir(), "ai-context-governance-"));
  const zip = new AdmZip(sourcePath);
  zip.extractAllTo(workspacePath, true);

  return {
    sourcePath,
    workspacePath,
    cleanup: async () => {
      await rm(workspacePath, { recursive: true, force: true });
    }
  };
}
