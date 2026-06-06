import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { projectDetectSkill } from "../src/skills/projectDetect.js";

const testRoots: string[] = [];

async function createPackageFixture(packageJson: unknown): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "project-detect-test-"));
  testRoots.push(root);
  await writeFile(join(root, "package.json"), `${JSON.stringify(packageJson, null, 2)}\n`, "utf8");
  return root;
}

describe("projectDetectSkill", () => {
  afterEach(async () => {
    await Promise.all(
      testRoots.splice(0).map((root) => rm(root, { recursive: true, force: true }))
    );
  });

  it("classifies jupui projects as vue2 with jupui evidence taking priority", async () => {
    const profile = await projectDetectSkill("tests/fixtures/jupui-vue2");

    expect(profile.stack).toBe("vue2");
    expect(profile.stackEvidence).toEqual(["dependency:jupui"]);
    expect(profile.buildTool).toBe("vue-cli");
    expect(profile.uiFrameworks).toEqual(["jupui"]);
    expect(profile.commands).toEqual({ build: "vue-cli-service build" });
    expect(profile.packageManager).toBe("npm");
    expect(profile.sourceDirs).toEqual(["src"]);
    expect(profile.confirmationItems).toEqual([]);
  });

  it("returns unknown with a confirmation item when no stack signal exists", async () => {
    const root = await createPackageFixture({
      scripts: {
        test: "vitest run"
      },
      dependencies: {
        lodash: "^4.17.21"
      }
    });

    const profile = await projectDetectSkill(root);

    expect(profile.stack).toBe("unknown");
    expect(profile.stackEvidence).toEqual([]);
    expect(profile.buildTool).toBeUndefined();
    expect(profile.uiFrameworks).toEqual([]);
    expect(profile.commands).toEqual({ test: "vitest run" });
    expect(profile.packageManager).toBe("npm");
    expect(profile.sourceDirs).toEqual(["src"]);
    expect(profile.confirmationItems).toEqual(["Unable to identify frontend stack"]);
  });

  it("detects React projects and Vite build tooling", async () => {
    const root = await createPackageFixture({
      scripts: {
        dev: "vite --host 0.0.0.0"
      },
      dependencies: {
        react: "^18.2.0",
        vite: "^5.0.0",
        antd: "^5.0.0"
      }
    });

    const profile = await projectDetectSkill(root);

    expect(profile.stack).toBe("react");
    expect(profile.stackEvidence).toEqual(["dependency:react"]);
    expect(profile.buildTool).toBe("vite");
    expect(profile.uiFrameworks).toEqual(["antd"]);
  });

  it("detects Umi projects with priority over React signals", async () => {
    const root = await createPackageFixture({
      scripts: {
        build: "umi build"
      },
      dependencies: {
        "@umijs/max": "^4.0.0",
        react: "^18.2.0",
        "element-plus": "^2.0.0"
      }
    });

    const profile = await projectDetectSkill(root);

    expect(profile.stack).toBe("umi");
    expect(profile.stackEvidence).toEqual(["dependency:@umijs/max"]);
    expect(profile.buildTool).toBe("umi");
    expect(profile.uiFrameworks).toEqual(["element-plus"]);
  });
});
