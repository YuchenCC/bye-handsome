import type { ProjectProfile } from "../agent/types.js";
import { renderConstraintList } from "../generators/templates.js";
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

## Supported MVP Task Types

- Create list page
- Modify existing page
- Connect API
- Fix error

## plan-do Workflow

1. Parse the user request and classify it as create list page, modify existing page, connect API, or fix error.
2. Extract required fields. If page, route, API, component, business fields, permissions, dictionaries, or route information is missing, ask for confirmation.
3. Retrieve relevant files from \`.ai-index\`, policies from \`.ai-context\`, and human-readable context from \`docs/ai\`.
4. Produce a concise implementation plan and wait for user confirmation.
5. Generate a Qwen2.5-Coder-32B prompt with only the minimal necessary context.
6. After code is applied, run changed-file ESLint checks and generate a constrained repair prompt when needed.

## Context Retrieval

Read context in this order:

1. \`.ai-index/project-profile.json\` for stack, commands, request layer, source dirs, and quality hints.
2. \`.ai-index/pages.json\`, \`.ai-index/components.json\`, \`.ai-index/apis.json\`, and \`.ai-index/routes.json\` for task-relevant candidates.
3. \`.ai-index/templates.json\` and \`.ai-index/examples.json\` for reusable examples.
4. \`.ai-index/rules.json\` and \`.ai-context/qwen32b-context-policy.md\` for constraints.
5. Relevant \`docs/ai\` files for human-readable project conventions.

Only include context directly relevant to the requested task. Do not inject all documents or all source code.

## Missing Information Confirmation

Before producing the final prompt, confirm missing or ambiguous page, route, API, component, business fields, permissions, dictionaries.

Ask the user for clarification when:

- The target page or module cannot be matched from \`.ai-index/pages.json\`.
- The target route is missing or marked as \`待确认\`.
- The API method, path, request params, or response shape is not present in \`.ai-index/apis.json\`.
- A component, permission, dictionary, or business field is requested but not present in retrieved context.
- The requested task implies new dependencies, new request wrappers, or broad refactoring.

## Qwen32B Prompt Output Format

The generated prompt must include:

- Task Summary
- Confirmed Fields
- Retrieved Context
- Constraints
- Expected Changed Files
- Quality Checks
- Remaining TODO Fields

## Small Model Constraints

${renderConstraintList()}

## Changed-file ESLint Flow

Inspect changed \`.js\`, \`.jsx\`, \`.ts\`, \`.tsx\`, and \`.vue\` files only. Prefer project command hints: ${Object.entries(profile.commands)
    .map(([name, command]) => `${name}: ${command}`)
    .join("; ") || "待确认"}.

Use changed-file detection commands:

\`\`\`bash
git diff --name-only --diff-filter=ACMRTUXB
git diff --cached --name-only --diff-filter=ACMRTUXB
\`\`\`

Filter to frontend source files only before running ESLint.

## Repair Prompt Flow

When ESLint reports errors, summarize file, rule, line, and message. The repair prompt must only fix reported errors and must keep the original task scope.

The repair prompt must include:

- Original task summary
- Changed files with ESLint errors
- Rule, line, and message for each error
- Constraint that only reported ESLint errors may be fixed
- Constraint that unrelated files and behavior must not change
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
