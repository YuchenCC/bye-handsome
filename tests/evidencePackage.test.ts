import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { InventoryResult, ProjectProfile, TemplateExampleResult } from "../src/agent/types.js";
import {
  DEFAULT_SNIPPET_LIMITS,
  buildEvidencePackage,
  buildEvidencePackageWithSnippets,
  writeEvidencePackage
} from "../src/evidence/evidencePackage.js";

const testRoots: string[] = [];

const profile: ProjectProfile = {
  root: "/target/project",
  stack: "vue2",
  stackEvidence: ["dependency:vue@2.7.0"],
  buildTool: "webpack",
  uiFrameworks: ["element-ui"],
  qualityConfig: ["eslint"],
  commands: { lint: "eslint src" },
  packageManager: "npm",
  sourceDirs: ["src"],
  confirmationItems: ["无法确认权限规则"]
};

const inventory: InventoryResult = {
  pages: [{ name: "OrderList", filePath: "src/views/order/OrderList.vue", pageType: "view" }],
  components: [{ name: "OrderTable", filePath: "src/components/OrderTable.vue", props: [] }],
  apis: [{ name: "order", filePath: "src/api/order.ts" }],
  routes: [{ name: "routes", routePath: "待确认", filePath: "src/router/routes.ts" }],
  requestWrappers: [],
  pageApiRelations: [],
  confirmationItems: ["未识别到 request wrapper"]
};

const templates: TemplateExampleResult = {
  examples: [],
  confirmationItems: ["未找到可用模板示例"]
};

describe("evidence package", () => {
  afterEach(async () => {
    await Promise.all(
      testRoots.splice(0).map((root) => rm(root, { recursive: true, force: true }))
    );
  });

  it("builds bounded evidence from deterministic scan outputs", () => {
    const evidence = buildEvidencePackage({ profile, inventory, templates });

    expect(evidence.projectProfile.stack).toBe("vue2");
    expect(evidence.fileTree.sourceDirs).toEqual(["src"]);
    expect(evidence.candidates.pages).toHaveLength(1);
    expect(evidence.candidates.components[0].name).toBe("OrderTable");
    expect(evidence.candidates.apis[0].filePath).toBe("src/api/order.ts");
    expect(evidence.snippets.limits).toEqual(DEFAULT_SNIPPET_LIMITS);
    expect(evidence.snippets.items.length).toBeLessThanOrEqual(DEFAULT_SNIPPET_LIMITS.maxFiles);
    expect(evidence.unresolvedItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ message: "无法确认权限规则" }),
        expect.objectContaining({ message: "未识别到 request wrapper" }),
        expect.objectContaining({ message: "未找到可用模板示例" })
      ])
    );
  });

  it("writes evidence package files for downstream model-assisted Skills", async () => {
    const outputPath = await mkdtemp(join(tmpdir(), "evidence-package-test-"));
    testRoots.push(outputPath);
    const evidence = buildEvidencePackage({ profile, inventory, templates });

    await writeEvidencePackage(outputPath, evidence);

    await expect(access(join(outputPath, ".evidence/project-profile.json"))).resolves.toBeUndefined();
    await expect(access(join(outputPath, ".evidence/file-tree.json"))).resolves.toBeUndefined();
    await expect(access(join(outputPath, ".evidence/candidates/pages.json"))).resolves.toBeUndefined();
    await expect(access(join(outputPath, ".evidence/candidates/components.json"))).resolves.toBeUndefined();
    await expect(access(join(outputPath, ".evidence/candidates/apis.json"))).resolves.toBeUndefined();
    await expect(access(join(outputPath, ".evidence/candidates/routes.json"))).resolves.toBeUndefined();
    await expect(
      access(join(outputPath, ".evidence/candidates/request-wrappers.json"))
    ).resolves.toBeUndefined();
    await expect(access(join(outputPath, ".evidence/snippets.json"))).resolves.toBeUndefined();
    await expect(access(join(outputPath, ".evidence/unresolved-items.json"))).resolves.toBeUndefined();

    const unresolved = JSON.parse(
      await readFile(join(outputPath, ".evidence/unresolved-items.json"), "utf8")
    ) as Array<{ message: string }>;
    expect(unresolved.map((item) => item.message)).toContain("未识别到 request wrapper");
  });

  it("writes bounded source snippet content for selected candidates", async () => {
    const root = await mkdtemp(join(tmpdir(), "evidence-snippet-source-"));
    testRoots.push(root);
    await mkdir(join(root, "src/api"), { recursive: true });
    await writeFile(join(root, "src/api/order.ts"), "export const listOrders = () => request.get('/api/orders');\n", "utf8");
    const evidence = await buildEvidencePackageWithSnippets({
      profile: { ...profile, root },
      inventory,
      templates
    });

    expect(evidence.snippets.items.length).toBeGreaterThan(0);
    const snippetWithContent = evidence.snippets.items.find((item) => item.content.trim().length > 0);
    expect(snippetWithContent).toEqual(expect.objectContaining({ filePath: expect.stringMatching(/^src\//) }));
  });
});
