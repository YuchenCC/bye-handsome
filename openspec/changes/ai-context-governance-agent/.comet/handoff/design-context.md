# Comet Design Handoff

- Change: ai-context-governance-agent
- Phase: design
- Mode: compact
- Context hash: 4d97a5099333fb2c3f4919803bf2c240ada7fe2e24a37e6e62deca1f451f9f42

Generated-by: comet-handoff.sh

OpenSpec remains the canonical capability spec. This handoff is a deterministic, source-traceable context pack, not an agent-authored summary.

## openspec/changes/ai-context-governance-agent/proposal.md

- Source: openspec/changes/ai-context-governance-agent/proposal.md
- Lines: 1-42
- SHA256: 8a777e6fad27f08e1a6a7871fff20190bc04d5ba16e44cdb5b21eceae3003783

```md
## Why

存量前端系统在接入 Qwen2.5-Coder-32B 等 AI Coding 模型时，普遍缺少结构化、可检索、可约束的项目上下文，导致模型容易编造组件、接口、import、字段和修改范围。

本变更引入一个只负责上下文治理的 Agent，将源码 zip 或本地项目目录转化为中文上下文资料包和可复制的用户 AI Coding 引导 Skill，让后续代码生成发生在用户工程内且受上下文约束。

## What Changes

- 新增存量前端系统 AI Coding 上下文治理 Agent。
- 新增中等粒度上下文生成 Skills，由 Agent 根据项目画像编排调用。
- 支持输入单个源码 zip 或单个本地项目目录。
- 支持 Vue2、Vue3、React、Umi、Webpack、Vite、Vue CLI、JS/TS 混合项目的 MVP 识别和治理。
- 新增 `jupui` 依赖识别规则：命中 `jupui` 时按 Vue2 技术栈处理。
- 新增独立 `ai-context-package` 输出，包含中文 `docs/ai`、机器索引 `.ai-index`、Qwen 策略 `.ai-context` 和用户 Skill `.ai-skill/ai-coding-guide`。
- 新增用户 AI Coding 引导 Skill 生成能力，后续由用户在目标工程中使用。
- 用户 AI Coding 引导 Skill 内置 plan-do 流程、小模型约束、上下文召回、提示词生成和变更文件 ESLint 回检。
- 新增治理 Agent 自身使用文档，用于说明安装、输入、运行、输出、复制上下文包和故障处理。
- 新增受控模型调用设计：治理 Agent 可调用大模型生成上下文文档和用户引导 Skill，但不得调用模型生成业务代码。
- 支持两类模型来源：显式 API Key/provider 配置，以及当前使用场景内可用的模型能力，例如 Codex CLI 当前会话。
- 明确治理 Agent 不直接调用 Qwen 生成业务代码，不修改被扫描项目源码。

## Capabilities

### New Capabilities

- `context-governance-agent`: 接收源码 zip 或本地项目目录，识别项目画像，编排 Skills，输出上下文资料包。
- `context-generation-skills`: 提供项目识别、源码清单扫描、示例模板抽取、上下文文档生成、用户 Skill 生成等中等粒度 Skills。
- `context-package-output`: 定义 `docs/ai`、`.ai-index`、`.ai-context`、`.ai-skill/ai-coding-guide` 的输出结构和内容要求。
- `user-ai-coding-guide-skill`: 定义用户后续使用的 AI Coding 引导 Skill，包括 plan-do、Qwen32B 提示词生成、小模型约束和变更文件 ESLint 回检。
- `agent-usage-documentation`: 定义治理 Agent 自身使用文档，包括接入、运行、输出解释、复制流程和故障处理。
- `controlled-model-invocation`: 定义治理 Agent 如何统一、受控地调用大模型进行归纳、文档生成和 Skill 生成。

### Modified Capabilities

- None.

## Impact

- 新增 OpenSpec 规格和任务，用于指导后续实现。
- 后续实现将影响 Agent 编排代码、Skill 定义、扫描器、上下文文档生成器、索引生成器、用户引导 Skill 模板和使用说明。
- 不引入治理 Agent 直接调用 Qwen 生成业务代码的能力。
- 不要求变更被扫描项目源码。
```

## openspec/changes/ai-context-governance-agent/design.md

- Source: openspec/changes/ai-context-governance-agent/design.md
- Lines: 1-119
- SHA256: a557ffac883d5ea905797995e967072e1257f675e5bd35f5d8bab307cefb3987

[TRUNCATED]

```md
## Context

本项目面向存量前端系统接入 AI Coding 的上下文治理问题。目标用户提供单个源码 zip 或本地项目目录，治理 Agent 根据项目画像选择扫描策略和 Skill 组合，生成可复制到目标工程的上下文资料包。后续代码生成由用户在目标工程中使用生成的用户 AI Coding 引导 Skill 配合 Qwen2.5-Coder-32B 完成。

当前约束：

- 治理 Agent 不直接调用 Qwen2.5-Coder-32B 生成业务代码。
- 治理 Agent 不修改被扫描项目源码。
- MVP 仅支持单个前端项目输入，不处理多项目批量治理。
- 文档产物默认使用中文。
- 设计需兼容 GPT 类模型和 Qwen2.5-Coder-32B 等 32B 级模型。

## Goals / Non-Goals

**Goals:**

- 建立治理 Agent 中心化编排流程。
- 建立中等粒度 Skill 架构，降低 Agent 调度复杂度。
- 生成 `docs/ai`、`.ai-index`、`.ai-context`、`.ai-skill/ai-coding-guide` 四类产物。
- 生成治理 Agent 自身使用文档，帮助系统负责人理解如何运行 Agent、检查输出和复制上下文包。
- 通过统一模型调用层支持受控调用大模型生成文档、策略和用户引导 Skill。
- 在用户引导 Skill 中内置 plan-do、上下文召回、小模型约束和变更文件 ESLint 回检。
- 显式支持 `jupui` 依赖命中时按 Vue2 技术栈处理。

**Non-Goals:**

- 不实现治理 Agent 直接代码生成闭环。
- 不允许治理 Agent 调用模型生成或应用业务代码 patch。
- 不默认执行全量 build 或全量 typecheck。
- 不自动治理全部历史代码问题。
- 不自动拆分 monorepo 多应用。
- 不替代人工 Code Review、业务确认和安全评审。

## Decisions

### Decision 1: Agent 中心化编排，Skill 中等粒度

采用“治理 Agent + 中等粒度 Skills”的结构。Agent 负责输入处理、项目画像读取、工作流选择、Skill 调用和产物汇总。Skill 对外保持 5 类：项目识别、源码清单扫描、示例模板抽取、上下文文档生成、用户 Skill 生成。

替代方案：

- 超细粒度 Skill：单个 Skill 压力较小，但 Agent 调度复杂，容易漏调、重复合并或状态漂移。
- 少量大聚合 Skill：编排简单，但单个 Skill 上下文压力大，不利于 Qwen2.5-Coder-32B 稳定执行。

选择中等粒度是为了兼顾 GPT 类模型和 Qwen32B 的能力边界。

### Decision 2: 内部扫描器可按技术栈细分

对外不暴露大量细分 Skill，但每个 Skill 内部可以按 Vue2、Vue3、React、Umi 等技术栈选择不同扫描器。`project-detect-skill` 输出项目画像和推荐扫描策略，后续 Skill 根据该画像切换扫描逻辑。

### Decision 3: 输出独立上下文资料包

治理结果输出到独立 `ai-context-package`，避免直接污染被扫描项目。用户后续自行复制资料包到目标工程。

资料包包含：

- `docs/ai`：中文人读文档。
- `.ai-index`：机器检索索引。
- `.ai-context`：Qwen32B 固定规则和上下文策略。
- `.ai-skill/ai-coding-guide`：用户后续使用的 AI Coding 引导 Skill。

### Decision 4: ESLint 回检放在用户引导 Skill 阶段

治理 Agent 阶段不执行代码生成，也不执行变更文件 ESLint。ESLint 回检属于用户引导 Skill 的后置流程：用户完成 Qwen 代码生成后，引导 Skill 识别 Git 变更文件并执行轻量 ESLint 回检。

### Decision 5: 小模型约束写入 `.ai-context` 和用户 Skill

为了约束 Qwen2.5-Coder-32B，用户引导 Skill 生成任务时必须注入小模型约束，包括不得发明 import、不得新增第三方依赖、只能使用上下文中出现过的组件/API 风格、字段不确定时使用 `TODO`、优先输出 patch、不得修改无关文件。

### Decision 6: Agent 使用文档与输出包使用说明分离

治理 Agent 自身使用文档面向运行治理流程的人，说明如何安装、准备输入、运行 Agent、查看治理报告、复制 `ai-context-package`、处理常见失败。`docs/ai/AI_CODING_USER_GUIDE.md` 面向目标工程中的开发者，说明复制上下文后如何使用用户 AI Coding 引导 Skill。

两份文档职责不同，必须分离，避免把“如何运行治理 Agent”和“如何在目标工程中进行 AI Coding”混在一起。

### Decision 7: 确定性扫描 + 受控模型归纳

治理 Agent 采用“确定性扫描 + 受控模型归纳”的混合方式。目录遍历、依赖解析、文件发现、路由/接口/组件候选识别、JSON 索引生成优先由确定性扫描器完成。大模型用于非确定性归纳任务，例如页面用途总结、组件用途说明、模板说明、编码规则归纳、中文文档成文、`.ai-context` 策略文本和用户 AI Coding 引导 Skill 生成。

模型不得直接读取全量源码，不得自行决定修改文件，不得生成业务代码 patch。Agent 必须先将扫描器输出压缩为有限、结构化、可追溯的输入，再调用模型。
```

Full source: openspec/changes/ai-context-governance-agent/design.md

## openspec/changes/ai-context-governance-agent/tasks.md

- Source: openspec/changes/ai-context-governance-agent/tasks.md
- Lines: 1-50
- SHA256: fb6f40a46eecc783f0338a9fdb43316e38fdc936f8fcbd351a46fbc77cbc2c01

```md
## 1. Project Setup

- [ ] 1.1 Define the implementation module structure for the governance Agent, Skills, scanners, generators, templates, and test fixtures.
- [ ] 1.2 Add or confirm required runtime and development dependencies for CLI execution, zip handling, filesystem traversal, JSON output, and tests.
- [ ] 1.3 Add sample frontend fixture projects or fixture directories for Vue2, Vue3, React, Umi, and `jupui` detection.

## 2. Governance Agent

- [ ] 2.1 Implement input handling for a single source zip and a single local project directory.
- [ ] 2.2 Implement temporary workspace handling for zip extraction without modifying scanned source files.
- [ ] 2.3 Implement Agent workflow orchestration from project detection through final context package generation.
- [ ] 2.4 Implement governance report aggregation for scan results, missing items, errors, and manual confirmation items.
- [ ] 2.5 Add governance Agent usage documentation covering prerequisites, inputs, run flow, outputs, copy workflow, and troubleshooting.
- [ ] 2.6 Implement a unified model invocation layer that supports configured API models and current-session model mode.
- [ ] 2.7 Enforce the boundary that model calls may generate governance documentation and Skills but must not generate business code patches.

## 3. Context Generation Skills

- [ ] 3.1 Implement `project-detect-skill` with stack, dependency, command, directory, build tool, UI framework, request layer, route style, style system, and quality config detection.
- [ ] 3.2 Implement the `jupui` dependency rule so matching projects are classified as Vue2.
- [ ] 3.3 Implement `source-inventory-skill` for page, route, component, API, request wrapper, and basic page-to-API inventory generation.
- [ ] 3.4 Implement internal stack-specific scanner selection for Vue2, Vue3, React, and Umi without exposing each scanner as a separate external Skill.
- [ ] 3.5 Implement `example-template-skill` for extracting representative page, component, service, route, permission, and dictionary examples.

## 4. Context Package Output

- [ ] 4.1 Implement `context-doc-generate-skill` output for Chinese `docs/ai` documents.
- [ ] 4.2 Implement `.ai-index` JSON generation for project profile, pages, components, APIs, routes, templates, examples, and rules.
- [ ] 4.3 Implement `.ai-context` generation for Qwen32B system prompt, context policy, output format, plan-do policy, and quality check policy.
- [ ] 4.4 Ensure the final output is an independent `ai-context-package` directory and does not write generated files into the scanned project source.
- [ ] 4.5 Ensure generated output documentation clearly separates Agent usage from target-project AI Coding usage.
- [ ] 4.6 Validate model-generated JSON or Markdown artifacts against schemas or fixed templates before writing them.

## 5. User AI Coding Guide Skill

- [ ] 5.1 Implement `user-ai-coding-skill-generate-skill` to create `.ai-skill/ai-coding-guide/SKILL.md`, templates, checks, and usage instructions.
- [ ] 5.2 Encode the plan-do workflow for user request parsing, missing field confirmation, context retrieval, plan confirmation, Qwen prompt generation, and post-generation checks.
- [ ] 5.3 Encode small-model constraints forbidding invented imports, dependencies, components, APIs, request wrapper bypasses, unconfirmed fields, unrelated edits, and unrequested large refactors.
- [ ] 5.4 Add changed-file ESLint guidance or execution flow for `.js`, `.jsx`, `.ts`, `.tsx`, and `.vue` files.
- [ ] 5.5 Add ESLint error summarization and constrained repair prompt generation.

## 6. Verification

- [ ] 6.1 Add tests for zip input and local directory input.
- [ ] 6.2 Add tests for project detection, including `jupui` to Vue2 classification.
- [ ] 6.3 Add tests for inventory and template extraction against fixture projects.
- [ ] 6.4 Add tests or snapshots for `docs/ai`, `.ai-index`, `.ai-context`, and `.ai-skill/ai-coding-guide` output.
- [ ] 6.5 Add tests for configured model invocation, current-session model mode fallback, output validation, and business patch blocking.
- [ ] 6.6 Run OpenSpec validation for `ai-context-governance-agent`.
- [ ] 6.7 Run the project test suite and document any remaining manual verification gaps.
```

## openspec/changes/ai-context-governance-agent/specs/agent-usage-documentation/spec.md

- Source: openspec/changes/ai-context-governance-agent/specs/agent-usage-documentation/spec.md
- Lines: 1-29
- SHA256: 624b11d0b3166559fb0d6af8e44495a8766021554bcf7cd4e9a5cf59bac52350

```md
## ADDED Requirements

### Requirement: Agent usage guide
The system SHALL include a dedicated Agent usage guide that describes how to operate the governance Agent.

#### Scenario: Agent usage guide is generated or packaged
- **WHEN** the project documentation is prepared
- **THEN** the guide SHALL explain installation, source zip input, local project directory input, expected output, and completion criteria

### Requirement: Output interpretation guide
The Agent usage guide SHALL explain how to interpret generated outputs.

#### Scenario: User reviews generated context package
- **WHEN** the user opens the usage guide after a governance run
- **THEN** the guide SHALL explain `docs/ai`, `.ai-index`, `.ai-context`, `.ai-skill/ai-coding-guide`, and `governance-report.md`

### Requirement: Context package copy guide
The Agent usage guide SHALL explain how to copy generated outputs into the target engineering project.

#### Scenario: User prepares target project for AI Coding
- **WHEN** the user wants to use generated context in a target project
- **THEN** the guide SHALL distinguish copying context package files from running the generated user AI Coding guide Skill

### Requirement: Troubleshooting guide
The Agent usage guide SHALL include common troubleshooting guidance.

#### Scenario: Governance run has missing or ambiguous scan results
- **WHEN** the governance report lists manual confirmation items
- **THEN** the guide SHALL explain how to review missing items, decide whether to accept partial output, and rerun after correcting inputs
```

## openspec/changes/ai-context-governance-agent/specs/context-generation-skills/spec.md

- Source: openspec/changes/ai-context-governance-agent/specs/context-generation-skills/spec.md
- Lines: 1-43
- SHA256: ee7c1b789ce680912f59bf2b369b9af14e180f3ec73ab237f1d22dab9ef089ef

```md
## ADDED Requirements

### Requirement: Project detection Skill
The system SHALL provide a `project-detect-skill` that identifies project stack, dependencies, commands, directories, and code standards.

#### Scenario: package metadata exists
- **WHEN** `package.json` and related config files exist
- **THEN** the Skill SHALL output a structured project profile and recommended scan strategy

### Requirement: Source inventory Skill
The system SHALL provide a `source-inventory-skill` that scans pages, routes, components, APIs, request wrappers, and basic page-to-API relationships.

#### Scenario: Pages and services exist
- **WHEN** the project contains page files and service files
- **THEN** the Skill SHALL output structured page, route, component, and API inventories

### Requirement: Example template Skill
The system SHALL provide an `example-template-skill` that extracts high-relevance examples and templates from the scanned project.

#### Scenario: Similar list pages exist
- **WHEN** the project contains list page examples
- **THEN** the Skill SHALL extract list page examples with usage context, reference files, reusable components, naming rules, forbidden actions, and confirmation items

### Requirement: Context document generation Skill
The system SHALL provide a `context-doc-generate-skill` that converts structured scan results into Chinese documentation, JSON indexes, and Qwen context strategy files.

#### Scenario: Structured scan results are available
- **WHEN** project profile, inventories, and examples have been produced
- **THEN** the Skill SHALL generate `docs/ai`, `.ai-index`, and `.ai-context` outputs

### Requirement: User Skill generation Skill
The system SHALL provide a `user-ai-coding-skill-generate-skill` that generates a reusable user AI Coding guide Skill directory.

#### Scenario: Context package generation is complete
- **WHEN** `docs/ai`, `.ai-index`, and `.ai-context` have been generated
- **THEN** the Skill SHALL generate `.ai-skill/ai-coding-guide` with a `SKILL.md`, templates, checks, and usage instructions

### Requirement: Medium-grained external Skill boundary
The system SHALL expose medium-grained Skills externally while allowing internal scanners to vary by frontend stack.

#### Scenario: Vue2 project is detected
- **WHEN** the project profile identifies Vue2
- **THEN** downstream Skills MAY use Vue2-specific internal scanners without requiring a separate externally exposed Vue2 Skill
```

## openspec/changes/ai-context-governance-agent/specs/context-governance-agent/spec.md

- Source: openspec/changes/ai-context-governance-agent/specs/context-governance-agent/spec.md
- Lines: 1-65
- SHA256: a6c6913821991503523f25349abee3f17d0535c10bbd0b25dbc07bc469f1d52b

```md
## ADDED Requirements

### Requirement: Source input handling
The system SHALL allow the governance Agent to accept either a single frontend source zip or a single local frontend project directory as input.

#### Scenario: Zip input is provided
- **WHEN** the user provides a single source zip
- **THEN** the Agent SHALL extract it into a temporary workspace for scanning

#### Scenario: Local directory input is provided
- **WHEN** the user provides a local frontend project directory
- **THEN** the Agent SHALL scan that directory without modifying source files

### Requirement: Project profile detection
The system SHALL generate a project profile before invoking downstream scanning Skills.

#### Scenario: Supported frontend project is detected
- **WHEN** the project contains recognizable frontend dependencies, config files, or source directories
- **THEN** the Agent SHALL identify the likely technology stack, build tool, UI framework, request layer, routing style, style system, commands, and code quality config

### Requirement: Jupui Vue2 rule
The system SHALL classify a project as Vue2 when the project dependencies include `jupui`.

#### Scenario: jupui dependency exists
- **WHEN** `jupui` appears in project dependencies
- **THEN** the Agent SHALL select the Vue2 scanning strategy

### Requirement: Workflow orchestration
The system SHALL orchestrate context generation Skills according to the project profile.

#### Scenario: Project profile is complete
- **WHEN** project detection produces a supported project profile
- **THEN** the Agent SHALL invoke inventory scanning, example extraction, context document generation, and user guide Skill generation in sequence

### Requirement: Agent non-generation boundary
The governance Agent SHALL NOT directly invoke Qwen2.5-Coder-32B to generate business code.

#### Scenario: Context package is generated
- **WHEN** the Agent finishes generating the context package
- **THEN** the Agent SHALL stop without generating business code or applying patches to the scanned project

### Requirement: Governance report
The system SHALL produce a governance report that records scan results, missing information, errors, and manual confirmation items.

#### Scenario: Scanner cannot identify a route config
- **WHEN** route configuration cannot be reliably identified
- **THEN** the governance report SHALL include the missing route config as a manual confirmation item

### Requirement: Agent usage documentation
The system SHALL provide usage documentation for the governance Agent itself.

#### Scenario: User wants to run the governance Agent
- **WHEN** the user reads the Agent usage documentation
- **THEN** the documentation SHALL explain prerequisites, supported inputs, run flow, output package structure, how to inspect results, how to copy the context package, and common troubleshooting steps

### Requirement: Controlled model invocation boundary
The governance Agent SHALL be allowed to invoke large language models for context summarization, documentation generation, context policy generation, and user guide Skill generation, but SHALL NOT invoke models to generate business code patches.

#### Scenario: Model-assisted documentation generation
- **WHEN** deterministic scan results are available
- **THEN** the Agent MAY invoke a configured model or current-session model to summarize and generate context documentation from those scan results

#### Scenario: Business code generation requested during governance
- **WHEN** a model task would generate or apply business source code changes
- **THEN** the Agent SHALL reject that task as outside the governance boundary
```

## openspec/changes/ai-context-governance-agent/specs/context-package-output/spec.md

- Source: openspec/changes/ai-context-governance-agent/specs/context-package-output/spec.md
- Lines: 1-43
- SHA256: d0d51be1b6e8361119d5d9caa317c923a2d7a88dbfe9fa7290a2a2a835c9a864

```md
## ADDED Requirements

### Requirement: Independent context package
The system SHALL output an independent `ai-context-package` directory rather than writing generated context directly into the scanned project.

#### Scenario: Governance run completes
- **WHEN** all required generation steps complete
- **THEN** the output SHALL include an `ai-context-package` directory

### Requirement: Chinese docs output
The system SHALL generate human-readable context documents in Chinese under `docs/ai`.

#### Scenario: docs generation completes
- **WHEN** the context document generation Skill runs successfully
- **THEN** `docs/ai` SHALL include Chinese documents for system profile, page inventory, component inventory, API inventory, AI coding rules, user guide, and governance report

### Requirement: Machine index output
The system SHALL generate `.ai-index` JSON files for machine retrieval and prompt assembly.

#### Scenario: index generation completes
- **WHEN** structured scan results are available
- **THEN** `.ai-index` SHALL include JSON indexes for project profile, pages, components, APIs, routes, templates, examples, and rules

### Requirement: Qwen context policy output
The system SHALL generate `.ai-context` files for Qwen2.5-Coder-32B context selection, output format, plan-do policy, and quality check policy.

#### Scenario: Qwen policy generation completes
- **WHEN** context strategy files are generated
- **THEN** `.ai-context` SHALL include system prompt, context policy, output format, plan-do policy, and quality check files

### Requirement: User Skill package output
The system SHALL generate `.ai-skill/ai-coding-guide` as part of the context package.

#### Scenario: user guide Skill generation completes
- **WHEN** the user Skill generation step completes
- **THEN** `.ai-skill/ai-coding-guide` SHALL contain a `SKILL.md`, templates, checks, and installation or usage instructions

### Requirement: Minimal context selection policy
The system SHALL document a policy that prevents injecting all project documentation or all source code into one model request.

#### Scenario: context policy is generated
- **WHEN** `.ai-context/qwen32b-context-policy.md` is produced
- **THEN** it SHALL limit each task to AI coding rules, one task template, a small number of similar pages, related components, service examples, and quality check rules
```

## openspec/changes/ai-context-governance-agent/specs/controlled-model-invocation/spec.md

- Source: openspec/changes/ai-context-governance-agent/specs/controlled-model-invocation/spec.md
- Lines: 1-43
- SHA256: 02a9f4961bf253726373d922ee7c5da805161d4e8176efdb4c95f86a462aeecf

```md
## ADDED Requirements

### Requirement: Unified model invocation layer
The system SHALL route all large language model calls through a unified Agent-managed invocation layer.

#### Scenario: Skill needs model summarization
- **WHEN** a Skill requires model assistance for summarization or document generation
- **THEN** the Skill SHALL provide structured input and expected output schema to the Agent-managed model invocation layer

### Requirement: Configured model provider
The system SHALL support explicit configured model providers.

#### Scenario: API model configuration is provided
- **WHEN** provider, model, base URL, and API key configuration is available
- **THEN** the Agent SHALL be able to call that configured model for approved governance tasks

### Requirement: Current-session model provider
The system SHALL support using the model available in the current operating context when applicable.

#### Scenario: Agent runs inside an interactive Codex CLI session
- **WHEN** no explicit API model is configured and current-session model use is enabled
- **THEN** the Agent SHALL allow model-assisted governance steps to be completed through the current interactive model context

### Requirement: Deterministic scan before model summarization
The system SHALL perform deterministic scanning before model summarization.

#### Scenario: Documentation generation requires model assistance
- **WHEN** the Agent needs to generate narrative documentation
- **THEN** it SHALL first provide the model with bounded structured scan results rather than raw full-project source context

### Requirement: Model output validation
The system SHALL validate model outputs against a JSON schema or fixed Markdown template before writing generated artifacts.

#### Scenario: Model output does not match expected schema
- **WHEN** the model returns malformed or incomplete output
- **THEN** the Agent SHALL retry within a configured limit or record the failure as an exception or manual confirmation item

### Requirement: No model-generated business patch
The system SHALL prevent model calls from producing business source code patches during governance runs.

#### Scenario: Model task is prepared
- **WHEN** the prepared model task asks for business code generation or source patch output
- **THEN** the Agent SHALL block the task and report it as out of scope
```

## openspec/changes/ai-context-governance-agent/specs/user-ai-coding-guide-skill/spec.md

- Source: openspec/changes/ai-context-governance-agent/specs/user-ai-coding-guide-skill/spec.md
- Lines: 1-57
- SHA256: 1a88e58bd99f1f63f424f58cf17a22c6c9e09bb0d23abeaec3eb4be35ae88520

```md
## ADDED Requirements

### Requirement: Plan-do workflow
The generated user AI Coding guide Skill SHALL follow a plan-do workflow before producing Qwen2.5-Coder-32B task prompts.

#### Scenario: User submits a simple development request
- **WHEN** the user provides a natural language AI Coding request
- **THEN** the Skill SHALL identify task type, extract key fields, read context indexes, produce a plan, and ask for confirmation before generating the Qwen task prompt

### Requirement: Context retrieval
The generated user AI Coding guide Skill SHALL retrieve relevant context from `.ai-index` and `.ai-context`.

#### Scenario: Modify existing page task
- **WHEN** the user asks to modify an existing page
- **THEN** the Skill SHALL retrieve related page, component, API, template, rule, and Qwen policy context before generating a prompt

### Requirement: MVP task types
The generated user AI Coding guide Skill SHALL support create list page, modify existing page, connect API, and fix error tasks in MVP.

#### Scenario: Supported task is submitted
- **WHEN** the user request matches one of the four MVP task types
- **THEN** the Skill SHALL generate a structured plan and Qwen-compatible task prompt for that task type

### Requirement: Missing field confirmation
The generated user AI Coding guide Skill SHALL request user confirmation when required task fields are missing or ambiguous.

#### Scenario: API method is missing
- **WHEN** a task requires an API method but the user did not provide one and no matching API exists in context
- **THEN** the Skill SHALL ask the user to confirm or provide the API method instead of guessing

### Requirement: Small model constraints
The generated user AI Coding guide Skill SHALL include small-model constraints in Qwen task prompts.

#### Scenario: Prompt is generated
- **WHEN** the Skill generates a Qwen2.5-Coder-32B task prompt
- **THEN** the prompt SHALL forbid invented imports, new third-party dependencies, invented components, invented APIs, request wrapper bypasses, unconfirmed fields, unrelated file edits, and unrequested large refactors

### Requirement: TODO for uncertain fields
The generated user AI Coding guide Skill SHALL require Qwen to use `TODO` for uncertain fields rather than guessing.

#### Scenario: Field semantics are unclear
- **WHEN** a required business field cannot be confirmed from user input or context
- **THEN** the generated prompt SHALL instruct Qwen to mark the field with `TODO`

### Requirement: Changed-file ESLint check
The generated user AI Coding guide Skill SHALL perform or guide a changed-file ESLint check after code generation.

#### Scenario: Qwen outputs code changes
- **WHEN** code changes have been applied in the target project
- **THEN** the Skill SHALL identify changed frontend source files and run or guide ESLint checks for those files only

### Requirement: ESLint repair prompt
The generated user AI Coding guide Skill SHALL produce a repair prompt when changed-file ESLint reports errors.

#### Scenario: ESLint returns errors
- **WHEN** the changed-file ESLint check reports errors
- **THEN** the Skill SHALL summarize the errors and generate a constrained repair prompt for Qwen or the developer
```

