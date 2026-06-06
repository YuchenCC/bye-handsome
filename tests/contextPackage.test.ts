import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { InventoryResult, ProjectProfile, TemplateExampleResult } from "../src/agent/types.js";
import { contextDocGenerateSkill } from "../src/skills/contextDocGenerate.js";

const testRoots: string[] = [];

async function createOutputRoot(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "context-package-test-"));
  testRoots.push(root);
  return root;
}

const profile: ProjectProfile = {
  root: "/target/project",
  stack: "vue2",
  stackEvidence: ["dependency:jupui"],
  buildTool: "vue-cli",
  uiFrameworks: ["jupui"],
  qualityConfig: [],
  commands: { build: "vue-cli-service build" },
  packageManager: "npm",
  sourceDirs: ["src"],
  confirmationItems: []
};

const inventory: InventoryResult = {
  pages: [{ name: "UserList", filePath: "src/pages/UserList.vue", pageType: "page" }],
  components: [{ name: "UserTable", filePath: "src/components/UserTable.vue", props: [] }],
  apis: [{ name: "user", filePath: "src/api/user.ts" }],
  routes: [{ name: "index", routePath: "待确认", filePath: "src/router/index.ts" }],
  requestWrappers: [{ name: "request", filePath: "src/utils/request.ts" }],
  pageApiRelations: [
    { pageFilePath: "src/pages/UserList.vue", apiFilePath: "src/api/user.ts", confidence: "name-match" }
  ],
  confirmationItems: ["路由路径待确认"]
};

const templates: TemplateExampleResult = {
  examples: [{ kind: "page", title: "UserList", filePath: "src/pages/UserList.vue", notes: "列表页" }],
  confirmationItems: []
};

describe("contextDocGenerateSkill", () => {
  afterEach(async () => {
    await Promise.all(
      testRoots.splice(0).map((root) => rm(root, { recursive: true, force: true }))
    );
  });

  it("writes Chinese docs, machine indexes, Qwen policies, and Agent usage docs", async () => {
    const outputPath = await createOutputRoot();

    await contextDocGenerateSkill({ outputPath, profile, inventory, templates });

    await expect(access(join(outputPath, "docs/ai/system-profile.md"))).resolves.toBeUndefined();
    await expect(access(join(outputPath, ".ai-index/project-profile.json"))).resolves.toBeUndefined();
    await expect(access(join(outputPath, ".ai-index/request-wrappers.json"))).resolves.toBeUndefined();
    await expect(access(join(outputPath, ".ai-index/page-api-relations.json"))).resolves.toBeUndefined();
    await expect(access(join(outputPath, ".ai-context/qwen32b-context-policy.md"))).resolves.toBeUndefined();
    await expect(access(join(outputPath, ".ai-context/qwen32b-output-format.md"))).resolves.toBeUndefined();
    await expect(access(join(outputPath, ".ai-context/qwen32b-plan-do-policy.md"))).resolves.toBeUndefined();
    await expect(access(join(outputPath, ".ai-context/qwen32b-quality-check.md"))).resolves.toBeUndefined();
    await expect(access(join(outputPath, "docs/ai/templates/README.md"))).resolves.toBeUndefined();
    await expect(access(join(outputPath, "docs/ai/examples/README.md"))).resolves.toBeUndefined();
    await expect(access(join(outputPath, "AGENT_USAGE.md"))).resolves.toBeUndefined();

    const report = await readFile(join(outputPath, "docs/ai/governance-report.md"), "utf8");
    expect(report).toContain("治理报告");
    expect(report).toContain("路由路径待确认");

    const index = JSON.parse(
      await readFile(join(outputPath, ".ai-index/project-profile.json"), "utf8")
    ) as ProjectProfile;
    expect(index.stack).toBe("vue2");
  });
});
