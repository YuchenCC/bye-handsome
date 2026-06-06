import type { ProjectProfile } from "../agent/types.js";
import { writePackageFile } from "../generators/packageWriter.js";
import type { ModelClient } from "../model/modelClient.js";
import {
  assertNoBusinessPatchContent,
  validateMarkdownSections,
  withFallbackMarker
} from "../model/outputValidation.js";

export interface UserSkillGenerateOptions {
  outputPath: string;
  profile: ProjectProfile;
  modelClient?: ModelClient;
}

const skillRoot = ".ai-skill/ai-coding-guide";

export async function userAiCodingSkillGenerateSkill(
  options: UserSkillGenerateOptions
): Promise<void> {
  const skillContent = await renderSkillWithModel(options);
  await Promise.all([
    writePackageFile(options.outputPath, `${skillRoot}/SKILL.md`, skillContent),
    writePackageFile(
      options.outputPath,
      `${skillRoot}/templates/create-list-page.md`,
      renderTaskTemplate("create list page")
    ),
    writePackageFile(
      options.outputPath,
      `${skillRoot}/templates/modify-page.md`,
      renderTaskTemplate("modify existing page")
    ),
    writePackageFile(
      options.outputPath,
      `${skillRoot}/templates/connect-api.md`,
      renderTaskTemplate("connect API")
    ),
    writePackageFile(
      options.outputPath,
      `${skillRoot}/templates/fix-error.md`,
      renderTaskTemplate("fix error")
    ),
    writePackageFile(
      options.outputPath,
      `${skillRoot}/checks/eslint-changed-files.md`,
      renderEslintCheck(options.profile)
    )
  ]);
}

async function renderSkillWithModel(options: UserSkillGenerateOptions): Promise<string> {
  if (!options.modelClient) {
    return withFallbackMarker(renderSkill(options.profile));
  }

  try {
    const markdown = await options.modelClient.generateText({
      purpose: "user-skill",
      outputKind: "user-skill",
      system:
        "你是上下文治理 Agent。请生成目标工程侧 AI Coding Guide Skill，必须包含 # AI Coding Guide、## plan-do Workflow、## Small Model Constraints、## Changed-file ESLint Flow，不得输出业务源码 patch。",
      input: {
        profile: options.profile,
        requiredContext: [".ai-index", ".ai-context", "docs/ai"]
      }
    });
    validateMarkdownSections(markdown, [
      "# AI Coding Guide",
      "## plan-do Workflow",
      "## Small Model Constraints",
      "## Changed-file ESLint Flow"
    ]);
    assertNoBusinessPatchContent(markdown);
    return markdown;
  } catch (error) {
    if (isModelUnavailable(error)) {
      return withFallbackMarker(renderSkill(options.profile));
    }
    throw error;
  }
}

function isModelUnavailable(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message.includes("No model configured") ||
      error.message.includes("Current-session model task requires interactive handling"))
  );
}

function renderSkill(profile: ProjectProfile): string {
  return `---
name: ai-coding-guide
description: Guide Qwen2.5-Coder-32B coding tasks with generated project context
---

# AI Coding Guide

## Purpose

Use this Skill inside the target project after copying \`.ai-index\`, \`.ai-context\`, \`docs/ai\`, and \`.ai-skill/ai-coding-guide\`.

## Required Context Directories

- \`.ai-index\`
- \`.ai-context\`
- \`docs/ai\`

## plan-do Workflow

1. Parse the user request and classify it as create list page, modify existing page, connect API, or fix error.
2. Extract required fields. If page, route, API, component, or business field information is missing, ask for confirmation.
3. Retrieve relevant files from \`.ai-index\` and policies from \`.ai-context\`.
4. Produce a concise implementation plan and wait for user confirmation.
5. Generate a Qwen2.5-Coder-32B prompt with only the minimal necessary context.
6. After code is applied, run changed-file ESLint checks and generate a constrained repair prompt when needed.

## Supported MVP Task Types

- Create list page
- Modify existing page
- Connect API
- Fix error

## Qwen32B Prompt Output Format

The generated prompt must include task summary, confirmed fields, retrieved context, constraints, expected changed files, and quality checks.

## Small Model Constraints

不得发明不存在的 import。
不得新增第三方依赖。
不得编造项目中不存在的组件。
不得编造接口方法。
不得绕过项目既有 request wrapper。
字段不确定时必须使用 TODO。
不得修改无关文件。
不得进行未请求的大重构。

## Changed-file ESLint Flow

Inspect changed \`.js\`, \`.jsx\`, \`.ts\`, \`.tsx\`, and \`.vue\` files only. Prefer project command hints: ${Object.entries(profile.commands)
    .map(([name, command]) => `${name}: ${command}`)
    .join("; ") || "待确认"}.

## Repair Prompt Flow

When ESLint reports errors, summarize file, rule, line, and message. The repair prompt must only fix reported errors and must keep the original task scope.
`;
}

function renderTaskTemplate(taskType: string): string {
  return `# ${taskType}

## Required Fields

- Target page or module
- Related API or component context
- Confirmed fields and TODO fields

## Prompt Assembly

Read \`.ai-index\` and \`.ai-context\`, include only relevant context, then produce a plan-do prompt for Qwen2.5-Coder-32B.
`;
}

function renderEslintCheck(profile: ProjectProfile): string {
  return `# Changed-file ESLint

Check only changed frontend source files: \`.js\`, \`.jsx\`, \`.ts\`, \`.tsx\`, and \`.vue\`.

Project stack: ${profile.stack}

Suggested command source: use package scripts when available, otherwise ask the user before inventing commands.
`;
}
