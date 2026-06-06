---
comet_change: skill-driven-context-governance-prd
role: technical-design
canonical_spec: openspec
---

# Skill 驱动上下文治理技术设计

## 背景

当前项目已经具备 CLI、zip/目录输入处理、基础项目识别、Vue/React/Umi 候选扫描、资料包写入、模型调用边界和测试基础。主要偏差不在技术栈选择，而在职责划分：现有实现把 Node 静态扫描和固定模板作为主要产物生成方式，而下一轮目标是让治理 Agent 交付一组可被大模型或 Agent 调用的上下文治理 Skills。

OpenSpec 是本变更的唯一能力规格来源。本设计只补充实现方案、数据流、边界条件和测试策略。

## 目标

- 保留当前 CLI、workspace、scanner 和 writer 基础。
- 将 scanner 定位为确定性 evidence collector。
- 新增治理 Skill registry，作为模型/Agent 可调用能力清单。
- 新增 evidence package，作为模型辅助生成的唯一输入事实层。
- 将上下文文档、Qwen 策略、治理报告和用户 AI Coding 引导 Skill 改为模型辅助生成。
- 无模型配置时保留确定性 fallback，但必须明确标记。
- 在写入模型生成产物前执行 schema 或模板校验。
- 继续禁止治理 Agent 生成业务源码 patch 或修改被扫描项目源码。

## 总体架构

```text
CLI / Governance Agent
  |
  v
Workspace Input
  - local directory
  - zip extraction
  - single top-level root resolution
  |
  v
Deterministic Scanners
  - project profile
  - source inventory candidates
  - route/API/component/request clues
  - bounded snippets
  - unresolved items
  |
  v
Evidence Package
  - .evidence/project-profile.json
  - .evidence/file-tree.json
  - .evidence/candidates/*.json
  - .evidence/snippets.json
  - .evidence/unresolved-items.json
  |
  v
Governance Skill Registry
  - governance-skills/skill-registry.json
  - governance-skills/*.md
  |
  v
Model-assisted Skill Runner
  - context docs
  - qwen policies
  - governance report
  - generated ai-coding-guide Skill
  |
  v
Context Package
  - docs/ai
  - .ai-index
  - .ai-context
  - .ai-skill/ai-coding-guide
```

## 关键模块

### 1. Governance Skill Registry

新增 registry 生成模块，输出 JSON 和 Markdown 两种形式：

- JSON：供程序、模型和后续 Agent 检索使用。
- Markdown：供人审阅和复制使用。

每个 Skill 条目包含：

- `name`
- `purpose`
- `inputs`
- `outputs`
- `modelRequired`
- `allowedActions`
- `forbiddenActions`
- `validationPolicy`
- `failurePolicy`

首轮必需 Skills：

- `project-detect-skill`
- `source-inventory-skill`
- `example-template-skill`
- `context-doc-generate-skill`
- `qwen-context-policy-generate-skill`
- `governance-report-generate-skill`
- `user-ai-coding-skill-generate-skill`

所有可能触发模型输出的 Skill 必须显式禁止：

- 生成业务源码 patch。
- 修改被扫描项目源码。
- 编造未出现在 evidence 中的组件、API、路由、权限、字典或字段。

### 2. Evidence Package

Evidence package 是 scanner 和模型生成之间的稳定中间层。scanner 不再直接承担最终文档作者职责，而是负责收集可追溯事实。

建议结构：

```text
.evidence/
  project-profile.json
  file-tree.json
  candidates/
    pages.json
    components.json
    apis.json
    routes.json
    request-wrappers.json
  snippets.json
  unresolved-items.json
```

`snippets.json` 需要有明确限制，例如：

- 单文件最大行数。
- 总 snippet 最大字节数。
- 每类候选最多选取数量。

`unresolved-items.json` 需要覆盖：

- 无法识别技术栈。
- 无法确认页面目录。
- 无法确认路由路径。
- 无法确认 request wrapper。
- API 方法或路径缺失。
- 组件 props 无法可靠解析。
- 权限、字典、业务字段无法确认。
- 模板样例不足。

### 3. Model-assisted Skill Runner

模型调用继续通过现有 `modelClient` 边界，但主流程需要真正接入该 client。

建议流程：

```text
evidence package
  |
  v
prepare ModelRequest
  - purpose: documentation | context-policy | user-skill
  - outputKind: markdown-doc | json-index | context-policy | user-skill
  - system: Skill-specific generation rule
  - input: bounded evidence
  |
  v
modelClient.generateText()
  |
  v
validate output
  |
  v
write artifact or record unresolved failure
```

无模型配置时：

- 继续输出 deterministic fallback。
- 文件内必须明确标记“确定性 fallback 输出”。
- fallback 不应声称完成了模型归纳。

current-session model 模式：

- 保留为交互式 handoff 边界。
- CLI 自动化路径不依赖 current-session model。
- configured API model 是首轮自动模型生成路径。

### 4. Validation

JSON 产物使用 Zod schema 校验。

Markdown 产物至少校验：

- 必需一级/二级标题存在。
- 必需章节存在。
- 不包含业务源码 patch。
- 不包含“直接修改被扫描项目源码”的指令。
- 对 fallback 输出包含 fallback 标记。

校验失败时：

- 不写入目标产物。
- 在治理报告或 unresolved items 中记录失败。
- 错误信息包含 Skill 名称、产物类型和失败原因。

### 5. Context Package Layout

`.ai-context` 文件名需要与 PRD 对齐：

```text
.ai-context/
  qwen32b-system-prompt.md
  qwen32b-context-policy.md
  qwen32b-output-format.md
  qwen32b-plan-do-policy.md
  qwen32b-quality-check.md
```

`docs/ai/templates` 和 `docs/ai/examples` 应作为人读补充输出存在；`.ai-index/templates.json` 和 `.ai-index/examples.json` 作为机器检索索引存在。两者不是互斥关系。

zip 输入需要支持常见结构：

```text
project.zip
  project-name/
    package.json
    src/
```

解压后如果只有一个顶层目录且该目录包含 `package.json`，扫描 root 应切换到该目录。

### 6. Generated AI Coding Guide Skill

生成的 `.ai-skill/ai-coding-guide/SKILL.md` 必须是工作流型 Skill，而不只是说明书。

它需要包含：

- 任务分类：新增列表页、修改已有页面、接入接口、修复报错。
- 上下文读取顺序：`.ai-index`、`.ai-context`、相关 `docs/ai`。
- 缺失信息确认规则：页面、路由、API、组件、字段、权限、字典。
- plan-do 流程：先计划，确认后再生成 Qwen prompt。
- prompt 组装格式：任务摘要、已确认字段、召回上下文、约束、预计变更文件、质量检查。
- 小模型约束：禁止编造 import、依赖、组件、API、request wrapper、权限、字典、业务字段、API 入参/出参。
- changed-file ESLint：识别变更文件、只检查变更前端文件、生成受约束回修 prompt。

## 实施顺序

1. 新增 registry 类型、生成器和测试。
2. 新增 evidence package 类型、生成器和测试。
3. 修正 zip root 解析和输出文件名。
4. 接入 model-assisted generation，并保留 fallback。
5. 增加 JSON/Markdown 校验器。
6. 重写 generated ai-coding-guide Skill。
7. 更新 README 和 Agent usage 文档。
8. 跑完整测试和 TypeScript 校验。

## 测试策略

### Unit Tests

- Skill registry 包含必需 Skills。
- Skill registry 禁止业务 patch 和源码修改。
- Evidence package schema 正确。
- Snippet 限制生效。
- Markdown validator 能拒绝缺章节、业务 patch、缺 fallback 标记的输出。
- JSON validator 能拒绝 schema mismatch。

### Integration Tests

- 本地目录输入生成完整资料包。
- zip 输入带单顶层目录时能找到真实项目 root。
- 无模型配置时生成 fallback 标记。
- configured model mock 返回有效内容时写入模型辅助产物。
- configured model mock 返回非法内容时拒写并记录 unresolved item。

### Output Contract Tests

- `.ai-context` 文件名完全匹配 PRD。
- `docs/ai/templates` 和 `docs/ai/examples` 存在。
- `.ai-index`、`.evidence`、`governance-skills` 结构存在。
- `.ai-skill/ai-coding-guide/SKILL.md` 包含任务分类、上下文召回、缺失确认、Qwen prompt、ESLint 回修流程。

## 风险和缓解

- 模型输出漂移：通过 evidence 限界、schema/模板校验和 fallback 缓解。
- 上下文过大：通过 snippet 限制和候选数量限制缓解。
- Skill registry 过度设计：首轮只覆盖必需 Skills 和最小元数据。
- current-session model 自动化困难：首轮将其定义为交互式边界，不作为 CLI 自动路径。
- fallback 被误认为模型产物：文件内强制标记 fallback，并在治理报告中汇总。

## 不需要回写的 OpenSpec 变更

当前 4 个 delta specs 已覆盖本设计的关键验收点：

- `governance-skill-registry`
- `evidence-package-generation`
- `model-assisted-context-generation`
- `generated-ai-coding-guide-skill`

本阶段不需要新增 Spec Patch。
