import type { InventoryResult, ProjectProfile, TemplateExampleResult } from "../agent/types.js";
import { buildEvidencePackage, writeEvidencePackage } from "../evidence/evidencePackage.js";
import { writePackageFile, writePackageJson } from "../generators/packageWriter.js";
import {
  renderAgentUsage,
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
import { writeGovernanceSkillRegistry } from "./registry.js";

export interface ContextDocGenerateOptions {
  outputPath: string;
  profile: ProjectProfile;
  inventory: InventoryResult;
  templates: TemplateExampleResult;
}

export async function contextDocGenerateSkill(options: ContextDocGenerateOptions): Promise<void> {
  const input = {
    profile: options.profile,
    inventory: options.inventory,
    templates: options.templates
  };
  const evidence = buildEvidencePackage(input);

  await Promise.all([
    writeEvidencePackage(options.outputPath, evidence),
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
      renderGovernanceReport(input)
    ),
    writePackageFile(options.outputPath, "AGENT_USAGE.md", renderAgentUsage()),
    writePackageJson(options.outputPath, ".ai-index/project-profile.json", options.profile),
    writePackageJson(options.outputPath, ".ai-index/pages.json", options.inventory.pages),
    writePackageJson(options.outputPath, ".ai-index/components.json", options.inventory.components),
    writePackageJson(options.outputPath, ".ai-index/apis.json", options.inventory.apis),
    writePackageJson(options.outputPath, ".ai-index/routes.json", options.inventory.routes),
    writePackageJson(
      options.outputPath,
      ".ai-index/request-wrappers.json",
      options.inventory.requestWrappers
    ),
    writePackageJson(
      options.outputPath,
      ".ai-index/page-api-relations.json",
      options.inventory.pageApiRelations
    ),
    writePackageJson(options.outputPath, ".ai-index/templates.json", options.templates.examples),
    writePackageJson(options.outputPath, ".ai-index/examples.json", options.templates.examples),
    writePackageJson(options.outputPath, ".ai-index/rules.json", {
      constraints: [
        "no invented imports",
        "no new dependencies",
        "no invented components",
        "no invented APIs",
        "use TODO for uncertain fields",
        "no unrelated edits"
      ]
    }),
    writePackageFile(options.outputPath, ".ai-context/qwen32b-system-prompt.md", renderQwenSystemPrompt()),
    writePackageFile(options.outputPath, ".ai-context/qwen32b-context-policy.md", renderQwenPolicy()),
    writePackageFile(options.outputPath, ".ai-context/qwen32b-output-format.md", renderQwenOutputFormat()),
    writePackageFile(options.outputPath, ".ai-context/qwen32b-plan-do-policy.md", renderPlanDoPolicy()),
    writePackageFile(options.outputPath, ".ai-context/qwen32b-quality-check.md", renderQualityCheckPolicy()),
    writeGovernanceSkillRegistry(options.outputPath)
  ]);
}
