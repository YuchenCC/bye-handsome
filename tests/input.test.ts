import AdmZip from "adm-zip";
import { access, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { prepareWorkspace } from "../src/agent/input.js";

describe("prepareWorkspace", () => {
  it("uses a directory input without cleanup side effects", async () => {
    const dir = join(tmpdir(), `fixture-dir-${Date.now()}`);
    await mkdir(dir, { recursive: true });

    const workspace = await prepareWorkspace(dir);

    expect(workspace.workspacePath).toBe(dir);
    expect(workspace.sourcePath).toBe(dir);
    await workspace.cleanup();
    await expect(access(dir)).resolves.toBeUndefined();
  });

  it("rejects unsupported file input", async () => {
    const file = join(tmpdir(), `fixture-${Date.now()}.txt`);
    await writeFile(file, "not a zip", "utf8");

    await expect(prepareWorkspace(file)).rejects.toThrow(
      "Input must be a directory or .zip file"
    );
  });

  it("extracts zip input to a temporary workspace and cleans it up", async () => {
    const zipPath = join(tmpdir(), `fixture-${Date.now()}.zip`);
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
});
