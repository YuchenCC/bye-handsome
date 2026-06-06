import AdmZip from "adm-zip";
import { mkdtemp, readdir, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import type { WorkspaceInput } from "./types.js";

export const MAX_ZIP_ENTRIES = 1000;
export const MAX_UNCOMPRESSED_BYTES = 100 * 1024 * 1024;

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
  let projectWorkspacePath = workspacePath;
  try {
    const zip = new AdmZip(sourcePath);
    validateZipArchive(zip, sourcePath);
    zip.extractAllTo(workspacePath, true);
    projectWorkspacePath = await resolveExtractedProjectRoot(workspacePath);
  } catch (error) {
    await rm(workspacePath, { recursive: true, force: true });
    throw error;
  }

  return {
    sourcePath,
    workspacePath: projectWorkspacePath,
    cleanup: async () => {
      await rm(workspacePath, { recursive: true, force: true });
    }
  };
}

async function resolveExtractedProjectRoot(workspacePath: string): Promise<string> {
  const entries = await readdir(workspacePath, { withFileTypes: true });
  const visibleEntries = entries.filter((entry) => !entry.name.startsWith("__MACOSX"));
  if (visibleEntries.length !== 1 || !visibleEntries[0].isDirectory()) {
    return workspacePath;
  }

  const candidatePath = join(workspacePath, visibleEntries[0].name);
  try {
    const packageJson = await stat(join(candidatePath, "package.json"));
    return packageJson.isFile() ? candidatePath : workspacePath;
  } catch {
    return workspacePath;
  }
}

function validateZipArchive(zip: AdmZip, sourcePath: string): void {
  const entries = zip.getEntries();
  if (entries.length > MAX_ZIP_ENTRIES) {
    throw new Error(
      `Zip archive contains too many entries: ${entries.length} entries exceeds limit ${MAX_ZIP_ENTRIES} (${sourcePath})`
    );
  }

  const totalUncompressedBytes = entries.reduce(
    (total, entry) => total + entry.header.size,
    0
  );
  if (totalUncompressedBytes > MAX_UNCOMPRESSED_BYTES) {
    throw new Error(
      `Zip archive uncompressed size exceeds limit: ${totalUncompressedBytes} bytes exceeds limit ${MAX_UNCOMPRESSED_BYTES} (${sourcePath})`
    );
  }
}
