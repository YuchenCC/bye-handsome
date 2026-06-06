import AdmZip from "adm-zip";
import { access, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { MAX_ZIP_ENTRIES, prepareWorkspace } from "../src/agent/input.js";

const workspacePrefix = "ai-context-governance-";
const testRoots: string[] = [];

async function createTestRoot(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "input-test-"));
  testRoots.push(root);
  return root;
}

async function listGovernanceTempWorkspaces(): Promise<Set<string>> {
  const entries = await readdir(tmpdir(), { withFileTypes: true });
  return new Set(
    entries
      .filter((entry) => entry.isDirectory() && entry.name.startsWith(workspacePrefix))
      .map((entry) => entry.name)
  );
}

describe("prepareWorkspace", () => {
  afterEach(async () => {
    await Promise.all(
      testRoots.splice(0).map((root) => rm(root, { recursive: true, force: true }))
    );
  });

  it("uses a directory input without cleanup side effects", async () => {
    const dir = await createTestRoot();

    const workspace = await prepareWorkspace(dir);

    expect(workspace.workspacePath).toBe(dir);
    expect(workspace.sourcePath).toBe(dir);
    await workspace.cleanup();
    await expect(access(dir)).resolves.toBeUndefined();
  });

  it("rejects unsupported file input", async () => {
    const root = await createTestRoot();
    const file = join(root, "fixture.txt");
    await writeFile(file, "not a zip", "utf8");

    await expect(prepareWorkspace(file)).rejects.toThrow(
      "Input must be a directory or .zip file"
    );
  });

  it("extracts zip input to a temporary workspace and cleans it up", async () => {
    const root = await createTestRoot();
    const zipPath = join(root, "fixture.zip");
    const zip = new AdmZip();
    zip.addFile("src/index.ts", Buffer.from("export const ok = true;\n", "utf8"));
    zip.writeZip(zipPath);

    const workspace = await prepareWorkspace(zipPath);

    expect(workspace.sourcePath).toBe(zipPath);
    expect(workspace.workspacePath).not.toBe(zipPath);
    await expect(access(join(workspace.workspacePath, "src", "index.ts"))).resolves.toBeUndefined();

    const extractedPath = workspace.workspacePath;
    await workspace.cleanup();
    await expect(access(extractedPath)).rejects.toThrow();
  });

  it("removes the temporary workspace when zip parsing fails", async () => {
    const root = await createTestRoot();
    const zipPath = join(root, "corrupt.zip");
    await writeFile(zipPath, "not a valid zip", "utf8");
    const before = await listGovernanceTempWorkspaces();

    await expect(prepareWorkspace(zipPath)).rejects.toThrow();

    const after = await listGovernanceTempWorkspaces();
    const newWorkspaces = [...after].filter((entry) => !before.has(entry));
    expect(newWorkspaces).toEqual([]);
  });

  it("rejects zip input with too many entries before extraction", async () => {
    const root = await createTestRoot();
    const zipPath = join(root, "too-many-entries.zip");
    const zip = new AdmZip();
    for (let index = 0; index <= MAX_ZIP_ENTRIES; index += 1) {
      zip.addFile(`files/${index}.txt`, Buffer.alloc(0));
    }
    zip.writeZip(zipPath);

    await expect(prepareWorkspace(zipPath)).rejects.toThrow(
      `Zip archive contains too many entries`
    );
  });
});
