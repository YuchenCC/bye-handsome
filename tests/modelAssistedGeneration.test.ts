import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { InventoryResult, ProjectProfile, TemplateExampleResult } from "../src/agent/types.js";
import { createModelClient } from "../src/model/modelClient.js";
import {
  assertFallbackMarker,
  assertNoBusinessPatchContent,
  validateMarkdownSections
} from "../src/model/outputValidation.js";
import { contextDocGenerateSkill } from "../src/skills/contextDocGenerate.js";

const testRoots: string[] = [];

const profile: ProjectProfile = {
  root: "/target/project",
  stack: "react",
  stackEvidence: ["dependency:react"],
  uiFrameworks: ["antd"],
  qualityConfig: [],
  commands: {},
  sourceDirs: ["src"],
  confirmationItems: []
};

const inventory: InventoryResult = {
  pages: [{ name: "Dashboard", filePath: "src/pages/Dashboard.tsx", pageType: "page" }],
  components: [],
  apis: [],
  routes: [],
  requestWrappers: [],
  pageApiRelations: [],
  confirmationItems: []
};

const templates: TemplateExampleResult = {
  examples: [],
  confirmationItems: []
};

describe("model-assisted context generation", () => {
  afterEach(async () => {
    vi.unstubAllGlobals();
    await Promise.all(
      testRoots.splice(0).map((root) => rm(root, { recursive: true, force: true }))
    );
  });

  it("uses configured model output for governance report with evidence-shaped input", async () => {
    const outputPath = await mkdtemp(join(tmpdir(), "model-assisted-test-"));
    testRoots.push(outputPath);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: "# 治理报告\n\n## 扫描结果\n\n模型生成的治理报告。\n\n## 待人工确认\n\n- 暂无"
              }
            }
          ]
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content:
                  "# Qwen32B Context Policy\n\n禁止注入全量源码，只能使用 evidence package。"
              }
            }
          ]
        })
      });
    vi.stubGlobal("fetch", fetchMock);

    await contextDocGenerateSkill({
      outputPath,
      profile,
      inventory,
      templates,
      modelClient: createModelClient({
        provider: "openai-compatible",
        model: "qwen",
        baseUrl: "https://model.example/v1",
        apiKey: "secret"
      })
    });

    const report = await readFile(join(outputPath, "docs/ai/governance-report.md"), "utf8");
    expect(report).toContain("模型生成的治理报告");
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    const userInput = JSON.parse(body.messages[1].content);
    expect(userInput.projectProfile.stack).toBe("react");
    expect(userInput.candidates.pages[0].filePath).toBe("src/pages/Dashboard.tsx");
    expect(body.messages[1].content).not.toContain("export const");
  });

  it("labels deterministic fallback output when no model is configured", async () => {
    const outputPath = await mkdtemp(join(tmpdir(), "fallback-generation-test-"));
    testRoots.push(outputPath);

    await contextDocGenerateSkill({
      outputPath,
      profile,
      inventory,
      templates,
      modelClient: createModelClient({})
    });

    const report = await readFile(join(outputPath, "docs/ai/governance-report.md"), "utf8");
    expect(report).toContain("确定性 fallback 输出");
    expect(() => assertFallbackMarker(report)).not.toThrow();
  });


  it("records invalid model Markdown as failed generation status", async () => {
    const outputPath = await mkdtemp(join(tmpdir(), "invalid-model-output-test-"));
    testRoots.push(outputPath);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "# Invalid" } }] })
    });
    vi.stubGlobal("fetch", fetchMock);

    await contextDocGenerateSkill({
      outputPath,
      profile,
      inventory,
      templates,
      modelClient: createModelClient({
        provider: "openai-compatible",
        model: "qwen",
        baseUrl: "https://model.example/v1",
        apiKey: "secret"
      })
    });

    const report = await readFile(join(outputPath, "docs/ai/governance-report.md"), "utf8");
    expect(report).toContain("Failed 产物");
    expect(report).toContain("Model Markdown validation failed");
    const status = JSON.parse(
      await readFile(join(outputPath, ".evidence/generation-status.json"), "utf8")
    ) as Array<{ status: string }>;
    expect(status).toEqual(expect.arrayContaining([expect.objectContaining({ status: "failed" })]));
  });

  it("rejects malformed or unsafe Markdown before writing model artifacts", () => {
    expect(() => validateMarkdownSections("# 治理报告\n", ["## 扫描结果"])).toThrow(
      "Model Markdown validation failed"
    );
    expect(() => assertNoBusinessPatchContent("diff --git a/src/a.ts b/src/a.ts")).toThrow(
      "Model Markdown validation failed"
    );
  });
});
