---
change: ai-context-governance-agent
design-doc: docs/superpowers/specs/2026-06-06-ai-context-governance-agent-technical-design.md
base-ref: 4d326425bbd6812867e7fa95caa0a3d75c73b114
---

# AI Context Governance Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a TypeScript CLI governance Agent that scans one frontend zip or local project directory and generates an AI Coding context package plus user guide Skill.

**Architecture:** The CLI owns orchestration and model invocation. Medium-grained Skills expose focused functions backed by deterministic scanners and template generators. Model calls receive bounded structured scan results and are blocked from producing business code patches.

**Tech Stack:** Node.js, TypeScript, Commander, fast-glob, adm-zip, Zod, Vitest, native `fetch` for configured model calls.

---

## File Structure

- Create `src/cli/index.ts`: CLI entrypoint and command parsing.
- Create `src/agent/governanceAgent.ts`: top-level orchestration for input, Skills, model calls, and output package generation.
- Create `src/agent/input.ts`: zip extraction and local directory input validation.
- Create `src/agent/types.ts`: shared Agent, Skill, scan, model, and output types.
- Create `src/model/modelClient.ts`: configured API model and current-session model abstraction.
- Create `src/model/schemaValidation.ts`: Zod-based output validation helpers.
- Create `src/skills/projectDetect.ts`: project profile detection Skill.
- Create `src/skills/sourceInventory.ts`: source inventory Skill.
- Create `src/skills/exampleTemplate.ts`: example and template extraction Skill.
- Create `src/skills/contextDocGenerate.ts`: `docs/ai`, `.ai-index`, `.ai-context` generation Skill.
- Create `src/skills/userSkillGenerate.ts`: `.ai-skill/ai-coding-guide` generation Skill.
- Create `src/scanners/projectScanner.ts`: package/config/directory detection.
- Create `src/scanners/vueScanner.ts`: Vue2/Vue3 page, component, route, and service hints.
- Create `src/scanners/reactScanner.ts`: React/Umi page, component, route, and service hints.
- Create `src/generators/packageWriter.ts`: output directory writer.
- Create `src/generators/templates.ts`: Markdown templates for docs and generated Skill.
- Create `tests/fixtures/`: minimal Vue2, `jupui`, Vue3, React, Umi fixture projects.
- Create `tests/*.test.ts`: unit and integration tests for Agent, Skills, model invocation, and output package structure.

## Task 1: Project Tooling

**Files:**
- Modify: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `src/cli/index.ts`

- [ ] **Step 1: Add runtime and dev dependencies**

Run:

```bash
npm install commander fast-glob adm-zip zod
npm install -D typescript tsx vitest @types/node
```

Expected: `package.json` contains runtime dependencies and dev dependencies for TypeScript and Vitest.

- [ ] **Step 2: Configure TypeScript**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "resolveJsonModule": true
  },
  "include": ["src/**/*.ts", "tests/**/*.ts"]
}
```

- [ ] **Step 3: Configure package scripts**

Update `package.json` with:

```json
{
  "type": "module",
  "bin": {
    "ai-context-governance": "./dist/cli/index.js"
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "vitest run",
    "dev": "tsx src/cli/index.ts",
    "lint": "tsc -p tsconfig.json --noEmit"
  }
}
```

Keep existing dependencies and merge rather than replacing the whole file blindly.

- [ ] **Step 4: Add Vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node"
  }
});
```

- [ ] **Step 5: Add CLI skeleton**

Create `src/cli/index.ts`:

```ts
#!/usr/bin/env node
import { Command } from "commander";
import { runGovernanceAgent } from "../agent/governanceAgent.js";

const program = new Command();

program
  .name("ai-context-governance")
  .description("Generate AI Coding context documents for legacy frontend projects")
  .requiredOption("-i, --input <path>", "source zip or local project directory")
  .option("-o, --output <path>", "output directory", "ai-context-package")
  .option("--model-provider <provider>", "configured model provider")
  .option("--model <model>", "configured model name")
  .option("--base-url <url>", "configured model API base URL")
  .option("--api-key <key>", "configured model API key")
  .option("--current-session-model", "use current interactive session model mode")
  .action(async (options) => {
    await runGovernanceAgent({
      inputPath: options.input,
      outputPath: options.output,
      model: {
        provider: options.modelProvider,
        model: options.model,
        baseUrl: options.baseUrl,
        apiKey: options.apiKey,
        useCurrentSession: Boolean(options.currentSessionModel)
      }
    });
  });

await program.parseAsync();
```

- [ ] **Step 6: Verify tooling**

Run:

```bash
npm run build
npm test
```

Expected: build succeeds after later source files are added; initial test command may report no tests until Task 8 adds tests.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json tsconfig.json vitest.config.ts src/cli/index.ts
git commit -m "chore: add TypeScript CLI tooling"
```

## Task 2: Shared Types and Input Handling

**Files:**
- Create: `src/agent/types.ts`
- Create: `src/agent/input.ts`
- Create: `tests/input.test.ts`

- [ ] **Step 1: Define shared types**

Create `src/agent/types.ts`:

```ts
export type FrontendStack = "vue2" | "vue3" | "react" | "umi" | "unknown";

export interface GovernanceAgentOptions {
  inputPath: string;
  outputPath: string;
  model: ModelOptions;
}

export interface ModelOptions {
  provider?: string;
  model?: string;
  baseUrl?: string;
  apiKey?: string;
  useCurrentSession?: boolean;
}

export interface WorkspaceInput {
  sourcePath: string;
  workspacePath: string;
  cleanup: () => Promise<void>;
}

export interface ProjectProfile {
  root: string;
  stack: FrontendStack;
  stackEvidence: string[];
  buildTool?: string;
  uiFrameworks: string[];
  commands: Record<string, string>;
  packageManager?: string;
  sourceDirs: string[];
  confirmationItems: string[];
}

export interface InventoryResult {
  pages: InventoryPage[];
  components: InventoryComponent[];
  apis: InventoryApi[];
  routes: InventoryRoute[];
  confirmationItems: string[];
}

export interface InventoryPage {
  name: string;
  filePath: string;
  routePath?: string;
  pageType?: string;
}

export interface InventoryComponent {
  name: string;
  filePath: string;
  usage?: string;
  props: string[];
}

export interface InventoryApi {
  name: string;
  filePath: string;
  method?: string;
  path?: string;
}

export interface InventoryRoute {
  name?: string;
  routePath: string;
  filePath: string;
}

export interface TemplateExampleResult {
  examples: Array<{
    kind: string;
    title: string;
    filePath: string;
    notes: string;
  }>;
  confirmationItems: string[];
}
```

- [ ] **Step 2: Implement input preparation**

Create `src/agent/input.ts`:

```ts
import AdmZip from "adm-zip";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import type { WorkspaceInput } from "./types.js";

export async function prepareWorkspace(inputPath: string): Promise<WorkspaceInput> {
  const sourcePath = resolve(inputPath);
  const info = await stat(sourcePath);

  if (info.isDirectory()) {
    return {
      sourcePath,
      workspacePath: sourcePath,
      cleanup: async () => undefined
    };
  }

  if (!info.isFile() || !sourcePath.toLowerCase().endsWith(".zip")) {
    throw new Error(`Input must be a directory or .zip file: ${sourcePath}`);
  }

  const workspacePath = await mkdtemp(join(tmpdir(), "ai-context-governance-"));
  const zip = new AdmZip(sourcePath);
  zip.extractAllTo(workspacePath, true);

  return {
    sourcePath,
    workspacePath,
    cleanup: async () => {
      await rm(workspacePath, { recursive: true, force: true });
    }
  };
}
```

- [ ] **Step 3: Add input tests**

Create `tests/input.test.ts` with directory and invalid input tests:

```ts
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { prepareWorkspace } from "../src/agent/input.js";

describe("prepareWorkspace", () => {
  it("uses a directory input without cleanup side effects", async () => {
    const dir = join(tmpdir(), `fixture-dir-${Date.now()}`);
    await mkdir(dir, { recursive: true });
    const workspace = await prepareWorkspace(dir);
    expect(workspace.workspacePath).toBe(dir);
    await workspace.cleanup();
  });

  it("rejects unsupported file input", async () => {
    const file = join(tmpdir(), `fixture-${Date.now()}.txt`);
    await writeFile(file, "not a zip", "utf8");
    await expect(prepareWorkspace(file)).rejects.toThrow("Input must be a directory or .zip file");
  });
});
```

- [ ] **Step 4: Run tests**

Run:

```bash
npm test -- tests/input.test.ts
```

Expected: both tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/agent/types.ts src/agent/input.ts tests/input.test.ts
git commit -m "feat: add governance input handling"
```

## Task 3: Model Invocation Layer

**Files:**
- Create: `src/model/modelClient.ts`
- Create: `src/model/schemaValidation.ts`
- Create: `tests/modelClient.test.ts`

- [ ] **Step 1: Implement model client boundary**

Create `src/model/modelClient.ts`:

```ts
import type { ModelOptions } from "../agent/types.js";

export interface ModelRequest {
  purpose: "documentation" | "context-policy" | "user-skill";
  system: string;
  input: unknown;
}

export interface ModelClient {
  generateText(request: ModelRequest): Promise<string>;
}

export function createModelClient(options: ModelOptions): ModelClient {
  if (options.provider && options.model && options.baseUrl && options.apiKey) {
    return new ConfiguredApiModelClient(options);
  }

  if (options.useCurrentSession) {
    return new CurrentSessionModelClient();
  }

  return new NoopModelClient();
}

class ConfiguredApiModelClient implements ModelClient {
  constructor(private readonly options: ModelOptions) {}

  async generateText(request: ModelRequest): Promise<string> {
    const response = await fetch(`${this.options.baseUrl!.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.options.apiKey}`
      },
      body: JSON.stringify({
        model: this.options.model,
        messages: [
          { role: "system", content: request.system },
          { role: "user", content: JSON.stringify(request.input) }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Model request failed: ${response.status} ${await response.text()}`);
    }

    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("Model response did not contain message content");
    }
    return content;
  }
}

class CurrentSessionModelClient implements ModelClient {
  async generateText(request: ModelRequest): Promise<string> {
    throw new Error(
      `Current-session model task requires interactive handling. Purpose: ${request.purpose}`
    );
  }
}

class NoopModelClient implements ModelClient {
  async generateText(request: ModelRequest): Promise<string> {
    throw new Error(`No model configured for governance task: ${request.purpose}`);
  }
}

export function assertGovernanceModelPurpose(purpose: string): asserts purpose is ModelRequest["purpose"] {
  if (!["documentation", "context-policy", "user-skill"].includes(purpose)) {
    throw new Error(`Blocked out-of-scope model purpose: ${purpose}`);
  }
}
```

- [ ] **Step 2: Implement schema validation helper**

Create `src/model/schemaValidation.ts`:

```ts
import type { ZodSchema } from "zod";

export function parseModelJson<T>(text: string, schema: ZodSchema<T>): T {
  const parsed = JSON.parse(text);
  return schema.parse(parsed);
}
```

- [ ] **Step 3: Add model tests**

Create `tests/modelClient.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { assertGovernanceModelPurpose, createModelClient } from "../src/model/modelClient.js";

describe("model invocation boundary", () => {
  it("blocks business patch model purposes", () => {
    expect(() => assertGovernanceModelPurpose("business-patch")).toThrow("Blocked out-of-scope");
  });

  it("requires explicit model or current-session mode", async () => {
    const client = createModelClient({});
    await expect(client.generateText({
      purpose: "documentation",
      system: "Summarize",
      input: { ok: true }
    })).rejects.toThrow("No model configured");
  });
});
```

- [ ] **Step 4: Run tests**

Run:

```bash
npm test -- tests/modelClient.test.ts
```

Expected: model boundary tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/model/modelClient.ts src/model/schemaValidation.ts tests/modelClient.test.ts
git commit -m "feat: add controlled model invocation"
```

## Task 4: Project Detection Skill

**Files:**
- Create: `src/scanners/projectScanner.ts`
- Create: `src/skills/projectDetect.ts`
- Create: `tests/projectDetect.test.ts`
- Create fixture files under `tests/fixtures/jupui-vue2/`

- [ ] **Step 1: Implement project scanner**

Create `src/scanners/projectScanner.ts`:

```ts
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ProjectProfile } from "../agent/types.js";

export async function scanProjectProfile(root: string): Promise<ProjectProfile> {
  const packageJsonPath = join(root, "package.json");
  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8")) as {
    scripts?: Record<string, string>;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };

  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  const depNames = Object.keys(deps);
  const stackEvidence: string[] = [];
  let stack: ProjectProfile["stack"] = "unknown";

  if (depNames.includes("jupui")) {
    stack = "vue2";
    stackEvidence.push("dependency:jupui");
  } else if (depNames.includes("umi") || depNames.includes("@umijs/max")) {
    stack = "umi";
    stackEvidence.push("dependency:umi");
  } else if (depNames.includes("vue")) {
    const vueVersion = deps.vue ?? "";
    stack = vueVersion.includes("2.") ? "vue2" : "vue3";
    stackEvidence.push(`dependency:vue@${vueVersion}`);
  } else if (depNames.includes("react")) {
    stack = "react";
    stackEvidence.push("dependency:react");
  }

  return {
    root,
    stack,
    stackEvidence,
    buildTool: detectBuildTool(depNames),
    uiFrameworks: depNames.filter((name) =>
      ["antd", "element-ui", "element-plus", "vant", "jupui"].includes(name)
    ),
    commands: packageJson.scripts ?? {},
    packageManager: "npm",
    sourceDirs: ["src"],
    confirmationItems: stack === "unknown" ? ["无法识别明确前端技术栈"] : []
  };
}

function detectBuildTool(depNames: string[]): string | undefined {
  if (depNames.includes("vite")) return "vite";
  if (depNames.includes("webpack")) return "webpack";
  if (depNames.includes("@vue/cli-service")) return "vue-cli";
  if (depNames.includes("umi") || depNames.includes("@umijs/max")) return "umi";
  return undefined;
}
```

- [ ] **Step 2: Implement Skill wrapper**

Create `src/skills/projectDetect.ts`:

```ts
import type { ProjectProfile } from "../agent/types.js";
import { scanProjectProfile } from "../scanners/projectScanner.js";

export async function projectDetectSkill(root: string): Promise<ProjectProfile> {
  return scanProjectProfile(root);
}
```

- [ ] **Step 3: Add `jupui` fixture and test**

Create `tests/fixtures/jupui-vue2/package.json`:

```json
{
  "scripts": {
    "build": "vue-cli-service build"
  },
  "dependencies": {
    "vue": "^2.7.0",
    "jupui": "^1.0.0",
    "@vue/cli-service": "^5.0.0"
  }
}
```

Create `tests/projectDetect.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { projectDetectSkill } from "../src/skills/projectDetect.js";

describe("projectDetectSkill", () => {
  it("classifies jupui projects as vue2", async () => {
    const profile = await projectDetectSkill("tests/fixtures/jupui-vue2");
    expect(profile.stack).toBe("vue2");
    expect(profile.stackEvidence).toContain("dependency:jupui");
  });
});
```

- [ ] **Step 4: Run tests**

Run:

```bash
npm test -- tests/projectDetect.test.ts
```

Expected: `jupui` fixture is classified as Vue2.

- [ ] **Step 5: Commit**

```bash
git add src/scanners/projectScanner.ts src/skills/projectDetect.ts tests/fixtures/jupui-vue2/package.json tests/projectDetect.test.ts
git commit -m "feat: add project detection skill"
```

## Task 5: Inventory and Template Skills

**Files:**
- Create: `src/scanners/vueScanner.ts`
- Create: `src/scanners/reactScanner.ts`
- Create: `src/skills/sourceInventory.ts`
- Create: `src/skills/exampleTemplate.ts`
- Create: `tests/sourceInventory.test.ts`

- [ ] **Step 1: Implement stack scanners**

Create scanners that use `fast-glob` to find page, component, service, and route candidates. Use extensions `js`, `jsx`, `ts`, `tsx`, and `vue`.

Vue scanner output rules:

```ts
// Pages: src/pages/**/*.vue, src/views/**/*.vue
// Components: src/components/**/*.vue, src/**/components/**/*.vue
// APIs: src/api/**/*.{js,ts}, src/services/**/*.{js,ts}
// Routes: src/router/**/*.{js,ts}
```

React/Umi scanner output rules:

```ts
// Pages: src/pages/**/*.{jsx,tsx,js,ts}
// Components: src/components/**/*.{jsx,tsx,js,ts}, src/**/components/**/*.{jsx,tsx,js,ts}
// APIs: src/api/**/*.{js,ts}, src/services/**/*.{js,ts}
// Routes: config/routes.{js,ts}, src/routes/**/*.{js,ts}
```

- [ ] **Step 2: Implement `sourceInventorySkill`**

Create `src/skills/sourceInventory.ts` that dispatches by `ProjectProfile.stack`:

```ts
import type { InventoryResult, ProjectProfile } from "../agent/types.js";
import { scanReactInventory } from "../scanners/reactScanner.js";
import { scanVueInventory } from "../scanners/vueScanner.js";

export async function sourceInventorySkill(profile: ProjectProfile): Promise<InventoryResult> {
  if (profile.stack === "vue2" || profile.stack === "vue3") {
    return scanVueInventory(profile.root);
  }
  if (profile.stack === "react" || profile.stack === "umi") {
    return scanReactInventory(profile.root);
  }
  return {
    pages: [],
    components: [],
    apis: [],
    routes: [],
    confirmationItems: ["未知技术栈，未执行页面/组件/API 扫描"]
  };
}
```

- [ ] **Step 3: Implement `exampleTemplateSkill`**

Create `src/skills/exampleTemplate.ts` that selects representative examples:

```ts
import type { InventoryResult, TemplateExampleResult } from "../agent/types.js";

export async function exampleTemplateSkill(inventory: InventoryResult): Promise<TemplateExampleResult> {
  const examples = [
    ...inventory.pages.slice(0, 3).map((page) => ({
      kind: "page",
      title: page.name,
      filePath: page.filePath,
      notes: `页面示例，类型：${page.pageType ?? "待确认"}`
    })),
    ...inventory.components.slice(0, 3).map((component) => ({
      kind: "component",
      title: component.name,
      filePath: component.filePath,
      notes: component.usage ?? "组件用途待确认"
    })),
    ...inventory.apis.slice(0, 3).map((api) => ({
      kind: "api",
      title: api.name,
      filePath: api.filePath,
      notes: `接口示例，方法：${api.method ?? "待确认"}`
    }))
  ];

  return {
    examples,
    confirmationItems: examples.length === 0 ? ["未找到可用模板示例"] : []
  };
}
```

- [ ] **Step 4: Add inventory tests**

Create a small fixture with `src/pages/UserList.vue`, `src/components/UserTable.vue`, and `src/api/user.ts`. Test that the inventory includes one page, one component, and one API.

- [ ] **Step 5: Run tests and commit**

```bash
npm test -- tests/sourceInventory.test.ts
git add src/scanners/vueScanner.ts src/scanners/reactScanner.ts src/skills/sourceInventory.ts src/skills/exampleTemplate.ts tests/sourceInventory.test.ts tests/fixtures
git commit -m "feat: add source inventory and template skills"
```

## Task 6: Context Package Generation

**Files:**
- Create: `src/generators/templates.ts`
- Create: `src/generators/packageWriter.ts`
- Create: `src/skills/contextDocGenerate.ts`
- Create: `tests/contextPackage.test.ts`

- [ ] **Step 1: Implement templates**

Create Markdown generators for:

- `docs/ai/README_AI.md`
- `docs/ai/system-profile.md`
- `docs/ai/page-inventory.md`
- `docs/ai/component-inventory.md`
- `docs/ai/api-inventory.md`
- `docs/ai/route-permission-map.md`
- `docs/ai/ai-coding-rules.md`
- `docs/ai/AI_CODING_USER_GUIDE.md`
- `docs/ai/governance-report.md`
- Agent usage guide, for example `AGENT_USAGE.md` at the package root.

- [ ] **Step 2: Implement package writer**

Create `src/generators/packageWriter.ts`:

```ts
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export async function writePackageFile(root: string, relativePath: string, content: string): Promise<void> {
  const outputPath = join(root, relativePath);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, content, "utf8");
}

export async function writePackageJson(root: string, relativePath: string, value: unknown): Promise<void> {
  await writePackageFile(root, relativePath, `${JSON.stringify(value, null, 2)}\n`);
}
```

- [ ] **Step 3: Implement context document Skill**

Create `src/skills/contextDocGenerate.ts` that writes:

```text
docs/ai/*.md
.ai-index/*.json
.ai-context/*.md
AGENT_USAGE.md
```

Use Chinese text for human-facing docs. Use stable English keys in JSON.

- [ ] **Step 4: Add output structure test**

Create `tests/contextPackage.test.ts` that runs the generator with a fixture profile and inventory, then asserts these files exist:

```text
docs/ai/system-profile.md
.ai-index/project-profile.json
.ai-context/qwen32b-context-policy.md
AGENT_USAGE.md
```

- [ ] **Step 5: Run tests and commit**

```bash
npm test -- tests/contextPackage.test.ts
git add src/generators/templates.ts src/generators/packageWriter.ts src/skills/contextDocGenerate.ts tests/contextPackage.test.ts
git commit -m "feat: generate context package outputs"
```

## Task 7: User AI Coding Guide Skill Generation

**Files:**
- Create: `src/skills/userSkillGenerate.ts`
- Create: `tests/userSkillGenerate.test.ts`

- [ ] **Step 1: Implement generated Skill template**

Create `.ai-skill/ai-coding-guide/SKILL.md` content with these sections:

- Purpose
- Required context directories
- Plan-do workflow
- Supported MVP task types
- Context retrieval rules
- Qwen32B prompt output format
- Small model constraints
- Changed-file ESLint flow
- Repair prompt flow

- [ ] **Step 2: Implement Skill generator**

Create `src/skills/userSkillGenerate.ts` that writes:

```text
.ai-skill/ai-coding-guide/SKILL.md
.ai-skill/ai-coding-guide/templates/create-list-page.md
.ai-skill/ai-coding-guide/templates/modify-page.md
.ai-skill/ai-coding-guide/templates/connect-api.md
.ai-skill/ai-coding-guide/templates/fix-error.md
.ai-skill/ai-coding-guide/checks/eslint-changed-files.md
```

- [ ] **Step 3: Include required constraints**

Ensure generated `SKILL.md` contains exact constraints:

```text
不得发明不存在的 import。
不得新增第三方依赖。
不得编造项目中不存在的组件。
不得编造接口方法。
字段不确定时必须使用 TODO。
不得修改无关文件。
```

- [ ] **Step 4: Add generated Skill test**

Create `tests/userSkillGenerate.test.ts` and assert generated `SKILL.md` contains `plan-do`, `.ai-index`, `.ai-context`, `ESLint`, and the six constraints above.

- [ ] **Step 5: Run tests and commit**

```bash
npm test -- tests/userSkillGenerate.test.ts
git add src/skills/userSkillGenerate.ts tests/userSkillGenerate.test.ts
git commit -m "feat: generate user AI coding guide skill"
```

## Task 8: Agent Orchestration

**Files:**
- Create: `src/agent/governanceAgent.ts`
- Modify: `src/cli/index.ts`
- Create: `tests/governanceAgent.test.ts`

- [ ] **Step 1: Implement Agent orchestration**

Create `src/agent/governanceAgent.ts`:

```ts
import { prepareWorkspace } from "./input.js";
import type { GovernanceAgentOptions } from "./types.js";
import { createModelClient } from "../model/modelClient.js";
import { projectDetectSkill } from "../skills/projectDetect.js";
import { sourceInventorySkill } from "../skills/sourceInventory.js";
import { exampleTemplateSkill } from "../skills/exampleTemplate.js";
import { contextDocGenerateSkill } from "../skills/contextDocGenerate.js";
import { userAiCodingSkillGenerateSkill } from "../skills/userSkillGenerate.js";

export async function runGovernanceAgent(options: GovernanceAgentOptions): Promise<void> {
  const workspace = await prepareWorkspace(options.inputPath);
  const modelClient = createModelClient(options.model);

  try {
    const profile = await projectDetectSkill(workspace.workspacePath);
    const inventory = await sourceInventorySkill(profile);
    const templates = await exampleTemplateSkill(inventory);

    await contextDocGenerateSkill({
      outputPath: options.outputPath,
      profile,
      inventory,
      templates,
      modelClient
    });

    await userAiCodingSkillGenerateSkill({
      outputPath: options.outputPath,
      profile,
      modelClient
    });
  } finally {
    await workspace.cleanup();
  }
}
```

- [ ] **Step 2: Add integration test**

Create `tests/governanceAgent.test.ts` that runs `runGovernanceAgent` on a fixture directory and asserts:

- output directory exists
- `AGENT_USAGE.md` exists
- `docs/ai/governance-report.md` exists
- `.ai-index/project-profile.json` exists
- `.ai-skill/ai-coding-guide/SKILL.md` exists

- [ ] **Step 3: Run full tests**

```bash
npm test
npm run build
```

Expected: all tests and TypeScript build pass.

- [ ] **Step 4: Commit**

```bash
git add src/agent/governanceAgent.ts src/cli/index.ts tests/governanceAgent.test.ts
git commit -m "feat: orchestrate context governance agent"
```

## Task 9: Documentation and Verification

**Files:**
- Modify: `README.md`
- Modify: `openspec/changes/ai-context-governance-agent/tasks.md`

- [ ] **Step 1: Update README**

Add CLI usage:

```bash
npm run build
npx ai-context-governance --input ./path/to/project --output ./ai-context-package
```

Add notes for configured model and current-session model modes.

- [ ] **Step 2: Run OpenSpec validation**

```bash
npx openspec validate ai-context-governance-agent
```

Expected: change is valid.

- [ ] **Step 3: Run project verification**

```bash
npm test
npm run build
```

Expected: all tests and TypeScript build pass.

- [ ] **Step 4: Mark OpenSpec tasks complete as implementation progresses**

Update `openspec/changes/ai-context-governance-agent/tasks.md` by changing completed checkboxes from `- [ ]` to `- [x]` after corresponding implementation tasks are verified.

- [ ] **Step 5: Commit**

```bash
git add README.md openspec/changes/ai-context-governance-agent/tasks.md
git commit -m "docs: document governance agent usage"
```

