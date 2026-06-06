import type { InventoryResult, ProjectProfile, TemplateExampleResult } from "../agent/types.js";

export interface ContextTemplateInput {
  profile: ProjectProfile;
  inventory: InventoryResult;
  templates: TemplateExampleResult;
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

- 不得发明不存在的 import。
- 不得新增第三方依赖。
- 不得编造项目中不存在的组件。
- 不得编造接口方法。
- 不得绕过项目既有 request wrapper。
- 字段不确定时必须使用 TODO。
- 不得修改无关文件。
- 不得进行未请求的大重构。
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
- \`.ai-index\`：机器检索索引。
- \`.ai-context\`：Qwen32B 上下文和输出策略。
- \`.ai-skill/ai-coding-guide\`：复制到目标工程后使用的 AI Coding 引导 Skill。
- \`docs/ai/governance-report.md\`：扫描结果、缺失信息和待确认项。

## 复制流程

治理 Agent 只生成独立上下文包，不修改被扫描源码。确认治理报告后，将需要的上下文目录复制到目标工程，再使用生成的用户 AI Coding guide Skill。

## 故障处理

如果治理报告列出缺失或歧义项，先人工确认项目结构、路由、接口和组件命名，再决定接受部分输出或修正输入后重新运行。
`;
}

export function renderQwenPolicy(): string {
  return `# Qwen32B Context Policy

每次任务只注入最小必要上下文：AI coding rules、一个任务模板、少量相似页面、相关组件、服务示例和质量检查规则。不得一次性注入全部项目文档或全部源码。
`;
}

export function renderQwenSystemPrompt(): string {
  return `# Qwen32B System Prompt

你是受项目上下文约束的前端代码助手。只能基于 \`.ai-index\` 和 \`.ai-context\` 中可追溯的信息生成方案或代码，不确定字段使用 TODO。
`;
}

export function renderQwenOutputFormat(): string {
  return `# Output Format

先输出计划，再输出文件级修改说明，最后输出 patch 或代码块。所有不确定项必须标记 TODO。
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
