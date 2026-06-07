import type { InventoryResult, ProjectProfile, TemplateExampleResult } from "../agent/types.js";
import { buildEvidencePackageWithSnippets, writeEvidencePackage } from "../evidence/evidencePackage.js";
import { writePackageFile, writePackageJson, writeValidatedPackageJson } from "../generators/packageWriter.js";
import {
  renderAgentUsage,
  AI_CODING_CONSTRAINTS,
  renderAiCodingRules,
  renderGovernanceReport,
  renderInventoryDoc,
  renderPlanDoPolicy,
  renderQualityCheckPolicy,
  renderExampleDocs,
  renderQwenOutputFormat,
  renderQwenPolicy,
  renderQwenSystemPrompt,
  renderSystemProfile,
  renderTemplateDocs,
  renderUserGuide
} from "../generators/templates.js";
import type { ModelClient } from "../model/modelClient.js";
import {
  inventoryArraySchema,
  pageApiRelationsSchema,
  projectProfileSchema
} from "../model/packageSchemas.js";
import {
  assertNoBusinessPatchContent,
  validateMarkdownSections,
  withFallbackMarker
} from "../model/outputValidation.js";
import { writeGovernanceSkillRegistry } from "./registry.js";

export interface ContextDocGenerateOptions {
  outputPath: string;
  profile: ProjectProfile;
  inventory: InventoryResult;
  templates: TemplateExampleResult;
  modelClient?: ModelClient;
}

export async function contextDocGenerateSkill(options: ContextDocGenerateOptions): Promise<void> {
  const input = {
    profile: options.profile,
    inventory: options.inventory,
    templates: options.templates
  };
  const generationStatus: Array<{ artifact: string; skill: string; status: "model" | "fallback" | "failed"; reason?: string }> = [];
  const evidence = await buildEvidencePackageWithSnippets(input, generationStatus);
  const governanceReportResult = await renderGovernanceReportWithModel(options, evidence);
  generationStatus.push(governanceReportResult.status);
  const qwenContextPolicyResult = await renderQwenPolicyWithModel(options, evidence);
  generationStatus.push(qwenContextPolicyResult.status);
  const finalEvidence = { ...evidence, generationStatus };
  const governanceReport = renderGovernanceReportWithStatus(governanceReportResult.markdown, generationStatus);

  await Promise.all([
    writeEvidencePackage(options.outputPath, finalEvidence),
    writePackageFile(options.outputPath, "docs/ai/README_AI.md", renderUserGuide()),
    writePackageFile(options.outputPath, "docs/ai/system-profile.md", renderSystemProfile(input)),
    writePackageFile(
      options.outputPath,
      "docs/ai/page-inventory.md",
      renderInventoryDoc("页面清单", options.inventory.pages)
    ),
    writePackageFile(
      options.outputPath,
      "docs/ai/component-inventory.md",
      renderInventoryDoc("组件清单", options.inventory.components)
    ),
    writePackageFile(
      options.outputPath,
      "docs/ai/api-inventory.md",
      renderInventoryDoc("API 清单", options.inventory.apis)
    ),
    writePackageFile(
      options.outputPath,
      "docs/ai/route-permission-map.md",
      renderInventoryDoc("路由与权限清单", options.inventory.routes)
    ),
    writePackageFile(options.outputPath, "docs/ai/ai-coding-rules.md", renderAiCodingRules()),
    writePackageFile(options.outputPath, "docs/ai/AI_CODING_USER_GUIDE.md", renderUserGuide()),
    writePackageFile(options.outputPath, "docs/ai/templates/README.md", renderTemplateDocs(input)),
    writePackageFile(options.outputPath, "docs/ai/examples/README.md", renderExampleDocs(input)),
    writePackageFile(
      options.outputPath,
      "docs/ai/governance-report.md",
      governanceReport
    ),
    writePackageFile(options.outputPath, "AGENT_USAGE.md", renderAgentUsage()),
    writeValidatedPackageJson(options.outputPath, ".ai-index/project-profile.json", options.profile, projectProfileSchema),
    writeValidatedPackageJson(options.outputPath, ".ai-index/pages.json", options.inventory.pages, inventoryArraySchema),
    writeValidatedPackageJson(options.outputPath, ".ai-index/components.json", options.inventory.components, inventoryArraySchema),
    writeValidatedPackageJson(options.outputPath, ".ai-index/apis.json", options.inventory.apis, inventoryArraySchema),
    writeValidatedPackageJson(options.outputPath, ".ai-index/routes.json", options.inventory.routes, inventoryArraySchema),
    writeValidatedPackageJson(
      options.outputPath,
      ".ai-index/request-wrappers.json",
      options.inventory.requestWrappers,
      inventoryArraySchema
    ),
    writeValidatedPackageJson(
      options.outputPath,
      ".ai-index/page-api-relations.json",
      options.inventory.pageApiRelations,
      pageApiRelationsSchema
    ),
    writePackageJson(options.outputPath, ".ai-index/templates.json", options.templates.examples),
    writePackageJson(options.outputPath, ".ai-index/examples.json", options.templates.examples),
    writePackageJson(options.outputPath, ".ai-index/rules.json", {
      constraints: [...AI_CODING_CONSTRAINTS]
    }),
    writePackageFile(options.outputPath, ".ai-context/qwen32b-system-prompt.md", renderQwenSystemPrompt()),
    writePackageFile(options.outputPath, ".ai-context/qwen32b-context-policy.md", qwenContextPolicyResult.markdown),
    writePackageFile(options.outputPath, ".ai-context/qwen32b-output-format.md", renderQwenOutputFormat()),
    writePackageFile(options.outputPath, ".ai-context/qwen32b-plan-do-policy.md", renderPlanDoPolicy()),
    writePackageFile(options.outputPath, ".ai-context/qwen32b-quality-check.md", renderQualityCheckPolicy()),
    writeGovernanceSkillRegistry(options.outputPath)
  ]);
}

async function renderQwenPolicyWithModel(
  options: ContextDocGenerateOptions,
  evidence: Awaited<ReturnType<typeof buildEvidencePackageWithSnippets>>
): Promise<{ markdown: string; status: { artifact: string; skill: string; status: "model" | "fallback" | "failed"; reason?: string } }> {
  const artifact = ".ai-context/qwen32b-context-policy.md";
  const skill = "qwen-context-policy-generate-skill";
  if (!options.modelClient) {
    return { markdown: withFallbackMarker(renderQwenPolicy()), status: { artifact, skill, status: "fallback", reason: "model client unavailable" } };
  }

  try {
    const markdown = await options.modelClient.generateText({
      purpose: "context-policy",
      outputKind: "context-policy",
      system:
        "你是上下文治理 Agent。请只基于输入 evidence 生成 Qwen32B 上下文选择策略，必须包含 # Qwen32B Context Policy，必须说明禁止注入全量源码，不得输出业务源码 patch。",
      input: evidence
    });
    validateMarkdownSections(markdown, ["# Qwen32B Context Policy"]);
    assertNoBusinessPatchContent(markdown);
    return { markdown, status: { artifact, skill, status: "model" } };
  } catch (error) {
    if (isModelUnavailable(error)) {
      return { markdown: withFallbackMarker(renderQwenPolicy()), status: { artifact, skill, status: "fallback", reason: error instanceof Error ? error.message : String(error) } };
    }
    return {
      markdown: withFallbackMarker(renderQwenPolicy()),
      status: {
        artifact,
        skill,
        status: "failed",
        reason: error instanceof Error ? error.message : String(error)
      }
    };
  }
}

async function renderGovernanceReportWithModel(
  options: ContextDocGenerateOptions,
  evidence: Awaited<ReturnType<typeof buildEvidencePackageWithSnippets>>
): Promise<{ markdown: string; status: { artifact: string; skill: string; status: "model" | "fallback" | "failed"; reason?: string } }> {
  const artifact = "docs/ai/governance-report.md";
  const skill = "governance-report-generate-skill";
  if (!options.modelClient) {
    return {
      markdown: withFallbackMarker(renderGovernanceReport({ profile: options.profile, inventory: options.inventory, templates: options.templates })),
      status: { artifact, skill, status: "fallback", reason: "model client unavailable" }
    };
  }

  try {
    const markdown = await options.modelClient.generateText({
      purpose: "documentation",
      outputKind: "markdown-doc",
      system:
        "你是上下文治理 Agent。请只基于输入 evidence 生成中文治理报告，必须包含 # 治理报告、## 扫描结果、## 待人工确认，不得输出业务源码 patch。",
      input: evidence
    });
    validateMarkdownSections(markdown, ["# 治理报告", "## 扫描结果", "## 待人工确认"]);
    assertNoBusinessPatchContent(markdown);
    return { markdown, status: { artifact, skill, status: "model" } };
  } catch (error) {
    if (isModelUnavailable(error)) {
      return {
        markdown: withFallbackMarker(renderGovernanceReport({ profile: options.profile, inventory: options.inventory, templates: options.templates })),
        status: { artifact, skill, status: "fallback", reason: error instanceof Error ? error.message : String(error) }
      };
    }
    return {
      markdown: withFallbackMarker(renderGovernanceReport({ profile: options.profile, inventory: options.inventory, templates: options.templates })),
      status: { artifact, skill, status: "failed", reason: error instanceof Error ? error.message : String(error) }
    };
  }
}

function renderGovernanceReportWithStatus(
  markdown: string,
  generationStatus: Array<{ artifact: string; skill: string; status: string; reason?: string }>
): string {
  const fallbackItems = generationStatus.filter((item) => item.status === "fallback");
  const failedItems = generationStatus.filter((item) => item.status === "failed");
  return `${markdown.trimEnd()}

## 生成状态

### Fallback 产物

${fallbackItems.map((item) => `- ${item.artifact}：${item.reason ?? "fallback"}`).join("\n") || "- 暂无"}

### Failed 产物

${failedItems.map((item) => `- ${item.artifact}：${item.reason ?? "failed"}`).join("\n") || "- 暂无"}
`;
}

function isModelUnavailable(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message.includes("No model configured") ||
      error.message.includes("Current-session model task requires interactive handling"))
  );
}
