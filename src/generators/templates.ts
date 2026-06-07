import type { InventoryResult, ProjectProfile, TemplateExampleResult } from "../agent/types.js";

export interface ContextTemplateInput {
  profile: ProjectProfile;
  inventory: InventoryResult;
  templates: TemplateExampleResult;
}

export const AI_CODING_CONSTRAINTS = [
  "不得发明不存在的 import。",
  "不得新增第三方依赖。",
  "不得编造项目中不存在的组件。",
  "不得编造接口方法。",
  "不得绕过项目既有 request wrapper。",
  "不得编造权限、字典或业务字段。",
  "不得猜测后端接口入参和出参。",
  "字段不确定时必须使用 TODO。",
  "不得修改无关文件。",
  "不得进行未请求的大重构。",
  "必须输出待确认事项。",
  "必须输出变更文件 ESLint 回检建议。"
] as const;

export function renderConstraintList(): string {
  return AI_CODING_CONSTRAINTS.map((constraint) => `- ${constraint}`).join("\n");
}

export function renderSystemProfile({ profile }: ContextTemplateInput): string {
  return `# 系统画像

- 技术栈：${profile.stack}
- 证据：${profile.stackEvidence.join(", ") || "待确认"}
- 构建工具：${profile.buildTool ?? "待确认"}
- UI 框架：${profile.uiFrameworks.join(", ") || "待确认"}
- 包管理器：${profile.packageManager ?? "待确认"}

## 常用命令

${Object.entries(profile.commands)
  .map(([name, command]) => `- ${name}: \`${command}\``)
  .join("\n") || "- 待确认"}
`;
}

export function renderInventoryDoc(title: string, rows: Array<{ name?: string; filePath: string }>): string {
  return `# ${title}

${rows.map((row) => `- ${row.name ?? "未命名"}：\`${row.filePath}\``).join("\n") || "- 暂无扫描结果"}
`;
}

export function renderAiCodingRules(): string {
  return `# AI Coding 规则

${renderConstraintList()}
`;
}

export function renderUserGuide(): string {
  return `# AI Coding 用户使用说明

本文档面向目标工程开发者。使用前先确认 \`.ai-index\`、\`.ai-context\` 和 \`.ai-skill/ai-coding-guide\` 已复制到目标工程。

每次任务先读取相关索引和策略，形成 plan-do 计划，确认后再生成 Qwen2.5-Coder-32B 任务提示词。
`;
}

export function renderGovernanceReport({ profile, inventory, templates }: ContextTemplateInput): string {
  const items = [
    ...profile.confirmationItems,
    ...inventory.confirmationItems,
    ...templates.confirmationItems
  ];

  return `# 治理报告

## 扫描结果

- 页面数量：${inventory.pages.length}
- 组件数量：${inventory.components.length}
- API 数量：${inventory.apis.length}
- 路由数量：${inventory.routes.length}
- 示例数量：${templates.examples.length}

## 待人工确认

${items.map((item) => `- ${item}`).join("\n") || "- 暂无"}
`;
}

export function renderAgentUsage(): string {
  return `# Governance Agent 使用说明

## 前置条件

- Node.js 运行环境。
- 可访问单个前端源码 zip 或本地项目目录。

## 运行方式

\`\`\`bash
npm run build
npx ai-context-governance --input ./path/to/project --output ./ai-context-package
\`\`\`

## 输出解释

- \`docs/ai\`：中文上下文文档。
- \`.evidence\`：确定性扫描得到的项目事实、候选清单、代码片段边界和待确认项。
- \`governance-skills\`：治理 Skill registry，列出可编排 Skill、输入输出、允许动作、禁止动作、校验策略和失败策略。
- \`.ai-index\`：机器检索索引。
- \`.ai-context\`：Qwen32B 上下文和输出策略。
- \`.ai-skill/ai-coding-guide\`：复制到目标工程后使用的 AI Coding 引导 Skill。
- \`docs/ai/governance-report.md\`：扫描结果、缺失信息和待确认项。

## 模型辅助与 fallback

显式配置模型时，治理 Agent 会通过受控模型调用生成上下文文档、Qwen 策略、治理报告和用户引导 Skill。模型输入只使用有边界的 evidence package，不注入全项目源码。

未配置模型或 current-session model 需要交互式处理时，治理 Agent 会生成确定性 fallback 输出，并在产物中标记“确定性 fallback 输出”。

## 复制流程

治理 Agent 只生成独立上下文包，不修改被扫描源码。确认治理报告后，将 \`.ai-index\`、\`.ai-context\`、\`docs/ai\` 和 \`.ai-skill/ai-coding-guide\` 复制到目标工程，再使用生成的用户 AI Coding guide Skill。

## 故障处理

如果治理报告列出缺失或歧义项，先人工确认项目结构、路由、接口和组件命名，再决定接受部分输出或修正输入后重新运行。
`;
}

export function renderQwenPolicy(): string {
  return `# Qwen32B Context Policy

每次任务只注入最小必要上下文：AI coding rules、一个任务模板、少量相似页面、相关组件、服务示例和质量检查规则。不得一次性注入全部项目文档或全部源码。

## Small Model Constraints

${renderConstraintList()}
`;
}

export function renderQwenSystemPrompt(): string {
  return `# Qwen32B System Prompt

你是受项目上下文约束的前端代码助手。只能基于 \`.ai-index\` 和 \`.ai-context\` 中可追溯的信息生成方案或代码，不确定字段使用 TODO。
`;
}

export function renderQwenOutputFormat(): string {
  return `# Output Format

1. 先输出任务理解和待确认事项。
2. 再输出文件级变更计划，并等待用户确认。
3. 用户确认后，才允许输出限定在本任务范围内的 patch 或代码块。
4. 必须列出 Expected Changed Files。
5. 所有不确定项必须标记 TODO。
6. 不得输出无关文件修改，不得扩大重构范围。
`;
}

export function renderPlanDoPolicy(): string {
  return `# Plan-Do Policy

先识别任务类型、读取相关上下文、列出计划并等待确认。确认后再进入执行提示词生成。
`;
}

export function renderQualityCheckPolicy(): string {
  return `# Quality Check Policy

代码生成后只检查变更过的前端源码文件，优先运行项目已有 ESLint 命令；错误修复不得扩大修改范围。
`;
}

export function renderTemplateDocs({ templates }: ContextTemplateInput): string {
  return `# 模板说明

${templates.examples
  .map((example) => `- ${example.title}：\`${example.filePath}\`，${example.notes}`)
  .join("\n") || "- 暂无模板示例，需人工补充。"}
`;
}

export function renderExampleDocs({ templates }: ContextTemplateInput): string {
  return `# 示例说明

${templates.examples
  .map((example) => `- ${example.kind} / ${example.title}：\`${example.filePath}\``)
  .join("\n") || "- 暂无示例，需人工补充。"}
`;
}
