import { writePackageFile, writePackageJson } from "../generators/packageWriter.js";

export interface GovernanceSkillDefinition {
  name: string;
  purpose: string;
  inputs: string[];
  outputs: string[];
  modelRequired: boolean;
  allowedActions: string[];
  forbiddenActions: string[];
  validationPolicy: string;
  failurePolicy: string;
}

export interface GovernanceSkillRegistry {
  version: 1;
  skills: GovernanceSkillDefinition[];
}

const businessPatchForbiddenActions = [
  "business source-code patch generation",
  "scanned project source modification",
  "inventing components, APIs, routes, permissions, dictionaries, or fields not present in evidence"
];

export function createGovernanceSkillRegistry(): GovernanceSkillRegistry {
  return {
    version: 1,
    skills: [
      {
        name: "project-detect-skill",
        purpose: "识别项目技术栈、构建工具、依赖、质量配置和基础工程画像。",
        inputs: ["package.json", "lock files", "config files", "source tree summary"],
        outputs: ["project profile", "stack evidence", "confirmation items"],
        modelRequired: false,
        allowedActions: ["read project metadata", "derive deterministic project profile"],
        forbiddenActions: ["scanned project source modification"],
        validationPolicy: "Profile output must use stable stack and command fields.",
        failurePolicy: "Record unknown stack or missing metadata as confirmation items."
      },
      {
        name: "source-inventory-skill",
        purpose: "收集页面、组件、API、路由、request wrapper 和基础引用关系候选。",
        inputs: ["project profile", "source tree"],
        outputs: ["inventory candidates", "unresolved scan items"],
        modelRequired: false,
        allowedActions: ["scan source file paths", "extract bounded deterministic candidates"],
        forbiddenActions: ["scanned project source modification"],
        validationPolicy: "Inventory output must preserve source file paths and stable fields.",
        failurePolicy: "Record incomplete route, API, component, or wrapper findings as unresolved items."
      },
      {
        name: "example-template-skill",
        purpose: "从清单候选中选择可复用示例和模板候选。",
        inputs: ["inventory candidates"],
        outputs: ["template examples", "example confirmation items"],
        modelRequired: false,
        allowedActions: ["select bounded examples", "label example usage"],
        forbiddenActions: ["scanned project source modification"],
        validationPolicy: "Template examples must point to existing candidate file paths.",
        failurePolicy: "Record insufficient examples as confirmation items."
      },
      {
        name: "context-doc-generate-skill",
        purpose: "基于 evidence package 生成中文上下文说明文档。",
        inputs: ["evidence package", "governance Skill registry"],
        outputs: ["docs/ai Markdown documents"],
        modelRequired: true,
        allowedActions: ["summarize evidence", "write governance documentation"],
        forbiddenActions: businessPatchForbiddenActions,
        validationPolicy: "Markdown must include required headings and pass forbidden patch checks.",
        failurePolicy: "Reject invalid model output and write deterministic fallback or unresolved failure."
      },
      {
        name: "qwen-context-policy-generate-skill",
        purpose: "生成 Qwen32B 上下文选择、输出格式、plan-do 和质量回检策略。",
        inputs: ["evidence package", "AI coding constraints"],
        outputs: [".ai-context policy files"],
        modelRequired: true,
        allowedActions: ["generate context selection policy", "generate output and quality policies"],
        forbiddenActions: businessPatchForbiddenActions,
        validationPolicy: "Policy Markdown must include required sections and bounded-context rules.",
        failurePolicy: "Reject invalid policy output and fall back to deterministic policy templates."
      },
      {
        name: "governance-report-generate-skill",
        purpose: "汇总扫描结果、模型生成状态、异常和待确认事项。",
        inputs: ["evidence package", "generation results"],
        outputs: ["docs/ai/governance-report.md"],
        modelRequired: true,
        allowedActions: ["summarize governance run", "list unresolved items"],
        forbiddenActions: businessPatchForbiddenActions,
        validationPolicy: "Report must include scan summary and unresolved items.",
        failurePolicy: "Write deterministic report when model output is unavailable or invalid."
      },
      {
        name: "user-ai-coding-skill-generate-skill",
        purpose: "生成目标工程侧可复制使用的 AI Coding 引导 Skill。",
        inputs: ["evidence package", ".ai-index", ".ai-context"],
        outputs: [".ai-skill/ai-coding-guide"],
        modelRequired: true,
        allowedActions: ["generate guide Skill workflow", "generate prompt assembly templates"],
        forbiddenActions: businessPatchForbiddenActions,
        validationPolicy: "Generated Skill must include retrieval, confirmation, plan-do, Qwen prompt, and ESLint repair flow.",
        failurePolicy: "Reject invalid generated Skill and fall back to deterministic guide templates."
      }
    ]
  };
}

export function renderSkillRegistryMarkdown(registry: GovernanceSkillRegistry): string {
  return `# Governance Skill Registry

本 registry 定义治理 Agent 可编排、模型可检查的上下文治理 Skills。

${registry.skills
  .map(
    (skill) => `## ${skill.name}

- Purpose: ${skill.purpose}
- Model required: ${skill.modelRequired ? "yes" : "no"}
- Inputs: ${skill.inputs.join("; ")}
- Outputs: ${skill.outputs.join("; ")}
- Allowed actions: ${skill.allowedActions.join("; ")}
- Forbidden actions: ${skill.forbiddenActions.join("; ")}
- Validation policy: ${skill.validationPolicy}
- Failure policy: ${skill.failurePolicy}
`
  )
  .join("\n")}
`;
}

export async function writeGovernanceSkillRegistry(outputPath: string): Promise<void> {
  const registry = createGovernanceSkillRegistry();
  await Promise.all([
    writePackageJson(outputPath, "governance-skills/skill-registry.json", registry),
    writePackageFile(
      outputPath,
      "governance-skills/SKILL_REGISTRY.md",
      renderSkillRegistryMarkdown(registry)
    )
  ]);
}
