# Comet Design Handoff

- Change: skill-driven-context-governance-prd
- Phase: design
- Mode: compact
- Context hash: 3d73508a564eb6a14ce029cf790943b5703585da00b4bdfa38469dc92669c636

Generated-by: comet-handoff.sh

OpenSpec remains the canonical capability spec. This handoff is a deterministic, source-traceable context pack, not an agent-authored summary.

## openspec/changes/skill-driven-context-governance-prd/proposal.md

- Source: openspec/changes/skill-driven-context-governance-prd/proposal.md
- Lines: 1-36
- SHA256: 715a58c53a05da4818b72a6084b3cf8f3fa09387b4236fd8616a0c60d9352f2f

```md
## Why

当前实现主要通过 Node.js 静态扫描和固定 Markdown 模板生成 AI 上下文资料包，但产品目标是交付一组可被大模型或 Agent 调用的治理 Skills：先用确定性证据收集项目事实，再由大模型辅助归纳、整理和编写上下文文档。

本变更将下一轮 PRD 重新对齐到 Skill 驱动的上下文治理：Node 仍作为证据收集层，但核心产物要变成可编排的治理 Skill 清单、模型辅助文档生成能力，以及可复制到目标工程使用的用户 AI Coding 引导 Skill。

## What Changes

- 新增治理 Skill registry，列出可被模型调用的 Skills、输入、输出、schema、允许动作、禁止动作和失败策略。
- 将现有 scanner 函数重新定位为确定性证据收集器，而不是最终文档作者。
- 新增 evidence package 契约，包含项目画像、文件树、页面/组件/API/路由候选、request wrapper、代码片段和待确认项。
- 要求上下文说明文档、Qwen 策略、治理报告、用户 AI Coding 引导 Skill 通过模型辅助生成。
- 无模型配置时保留确定性 fallback 输出，但必须明确标记为 fallback，并与模型辅助输出区分。
- 写入任何模型生成产物前，必须执行 schema 或模板校验。
- 修正输出目录结构和文件命名，使其与目标上下文资料包和 Qwen 策略布局一致。
- 强化生成的用户 AI Coding 引导 Skill，使其成为可执行的模型/Agent 工作流，而不是静态说明文档。

## Capabilities

### New Capabilities

- `governance-skill-registry`：定义治理 Skill 清单和元数据契约，使治理能力可被模型或 Agent 调用和检查。
- `evidence-package-generation`：定义确定性扫描器如何收集有边界的项目事实和代码片段，供后续模型辅助 Skills 使用。
- `model-assisted-context-generation`：定义大模型如何基于 evidence 生成可读文档、上下文策略、报告和索引，并进行校验。
- `generated-ai-coding-guide-skill`：定义更强的目标工程侧 Skill，用于读取上下文、制定计划、组装 Qwen prompt，并指导变更文件 ESLint 回修。

### Modified Capabilities

- 无。本仓库当前没有已归档到 `openspec/specs` 的主规格能力集；本变更以新增 capability 的方式定义下一轮 PRD。

## Impact

- 影响代码区域：`src/agent`、`src/skills`、`src/model`、`src/generators`、`src/scanners`、测试、README 和生成产物布局。
- 影响产物：`ai-context-package`、`.ai-index`、`.ai-context`、`.ai-skill/ai-coding-guide`，以及新增的治理 Skill registry 输出。
- CLI 可以保留，但核心职责需要从直接模板生成转为证据收集、Skill 编排和模型生成调度。
- 任何改造都不得让治理 Agent 生成业务源码 patch，也不得修改被扫描项目源码。
```

## openspec/changes/skill-driven-context-governance-prd/design.md

- Source: openspec/changes/skill-driven-context-governance-prd/design.md
- Lines: 1-79
- SHA256: d0040a7193c57e0fd1b49501eca3864efc9fa2c66cf95b1607623146d43fbe32

```md
## Context

现有项目已经具备可复用的基础设施：TypeScript CLI、zip/目录输入处理、基础项目识别、Vue/React/Umi 候选文件扫描、资料包写入工具、模型调用边界和测试。当前不匹配点是架构主语：现有 Skills 只是 TypeScript 辅助函数，最终文档主要由固定模板生成；而目标产品应是 Skill 驱动的上下文治理工作流，由可被模型调用的 Skills 基于确定性证据生成上下文资料，并指导后续 AI Coding。

下一轮迭代应保留确定性扫描基础，但将其降级为 evidence collection layer。主要产品表面应变成治理 Skill registry，加上模型辅助 Skills，用于生成并校验文档、上下文策略、治理报告和目标工程侧 AI Coding 引导 Skill。

## Goals / Non-Goals

**Goals:**

- 将下一轮 PRD 定义为围绕“可被模型调用的治理 Skills”展开，而不是围绕 Node-only 模板生成展开。
- 保留 Node.js 扫描作为项目事实和有边界代码片段的可靠证据收集器。
- 引入 Skill registry，明确描述可调用 Skills、模型需求、schema、允许动作、禁止动作和失败行为。
- 将模型辅助文档生成和 Skill 生成统一路由到现有模型调用边界。
- 模型输出写入文件前必须校验。
- 保持治理 Agent 不生成业务源码 patch、不修改被扫描源码项目的边界。

**Non-Goals:**

- 不整体替换 CLI、scanner 工具或输出写入工具。
- 不要求本轮完成所有前端代码的完美语义分析。
- 不在治理 Agent 中实现自主业务代码生成。
- 不默认执行全量 build、全量 typecheck 或全项目 lint。

## Decisions

### Decision 1: 改造而不是重写

项目 SHALL 保留现有 CLI、workspace preparation、scanners 和 writer utilities。重写会丢弃已经有价值的输入处理和证据收集代码。问题不在于存在 Node scanner，而在于职责分配错位。

备选方案：重建为纯 prompt/Skill 包。拒绝原因：模型仍然需要可靠证据，例如依赖数据、文件路径、代码片段、路由和 API 候选。

### Decision 2: 在 scanners 和模型 Skills 之间新增 evidence package

Scanners SHALL 输出有边界的结构化 evidence：项目画像、文件树、页面/组件/API/路由候选、request wrapper、代码片段和待确认项。模型辅助 Skills SHALL 消费这些 evidence，而不是消费原始全项目源码。

备选方案：让模型直接检查整个项目。拒绝原因：这会增加上下文体积、幻觉风险，并降低输出可复现性。

### Decision 3: 将 Skill registry 作为一等输出

上下文资料包 SHALL 包含治理 Skill registry。该 registry 是调用契约，说明模型或 Agent 可以调用哪些 Skills、每个 Skill 接受什么输入、返回什么输出，以及必须遵守哪些边界。

备选方案：继续只把 Skills 保留为内部 TypeScript 函数。拒绝原因：这无法满足“可被模型调用的治理能力”这一目标产物形态。

### Decision 4: 模型辅助生成并保留确定性 fallback

叙述性上下文文档、Qwen 策略、治理报告和生成的用户 AI Coding 引导 Skill，在模型配置可用时 SHALL 通过模型辅助生成。没有模型配置时，系统 MAY 生成确定性 fallback 产物，但这些产物 MUST 明确标记为 fallback，且不得被表述为等价于模型辅助输出。

备选方案：所有运行都强制要求模型。拒绝原因：会降低 MVP 可运行性和可测试性。

### Decision 5: 写入前校验

所有模型生成的 JSON 产物 SHALL 进行 schema 校验。模型生成的 Markdown 产物 SHALL 校验必需标题、必需章节，以及是否包含被禁止的业务 patch 内容。

备选方案：信任模型输出并直接写入。拒绝原因：本产品目标本身就是降低模型幻觉和失控输出。

## Risks / Trade-offs

- 模型输出不稳定 -> 缓解：使用有边界 evidence、明确输出契约、schema/模板校验和确定性 fallback。
- 相比当前模板生成会增加组件数量 -> 缓解：保持 scanner 契约窄而清晰，并在 Skill 边界增加测试。
- current-session model 模式无法在 CLI 内自动化 -> 缓解：定义为交互式 handoff 模式，自动化路径以 configured API model 为主。
- 生成的 Skill 可能过长影响使用 -> 缓解：主 Skill 保持任务流程简洁，把详细示例放到 templates/checks 文件中。

## Migration Plan

1. 新增 Skill registry 类型和生成器，不改变现有 scanner 行为。
2. 基于当前 scanner 结果新增 evidence package 输出。
3. 将上下文文档生成改为接收 evidence，并可选调用 model client。
4. 增加模型生成 Markdown 和 JSON 的校验器。
5. 强化生成的用户 AI Coding 引导 Skill。
6. 修正输出文件名，并增加测试锁定新的 PRD 行为。

回滚路径较简单：在引入模型辅助路径期间，现有确定性模板生成可以保留为 fallback。

## Open Questions

- 治理 Skill 定义应该输出 Markdown、JSON，还是两者都输出？
- configured API model 是否只支持 OpenAI-compatible chat completions，还是需要增加 provider-specific adapters？
- 第一轮允许抽取多少源码片段，才能在上下文体积和文档质量之间取得平衡？
```

## openspec/changes/skill-driven-context-governance-prd/tasks.md

- Source: openspec/changes/skill-driven-context-governance-prd/tasks.md
- Lines: 1-45
- SHA256: 9581e34e5a08d6b138d17ea28a4d79d309b15f0b99656237bc1b3e867cd4d8da

```md
## 1. Skill Registry

- [ ] 1.1 定义治理 Skill 元数据类型，包含 name、purpose、inputs、outputs、model requirement、allowed actions、forbidden actions、validation policy 和 failure policy。
- [ ] 1.2 实现 registry 生成器，列出项目识别、源码清单、示例/模板抽取、上下文文档生成、Qwen 策略生成、治理报告生成和用户 AI Coding 引导 Skill 生成。
- [ ] 1.3 使用稳定路径和稳定格式将 registry 写入上下文资料包。
- [ ] 1.4 增加测试，验证必需 Skills 和业务 patch 禁止项存在于 registry 中。

## 2. Evidence Package

- [ ] 2.1 定义 evidence package schema，包含项目画像、source dirs、文件树摘要、候选清单、代码片段和待确认项。
- [ ] 2.2 将 scanner 输出改造成有边界的 evidence，同时保留当前基础扫描行为。
- [ ] 2.3 为代码片段选择增加文件数量、字节数或行数限制。
- [ ] 2.4 持久化路由、API、组件 props、request wrapper、权限、字典和模板相关的待确认项。
- [ ] 2.5 增加测试，覆盖 evidence package 结构、有边界 snippets 和待确认项输出。

## 3. Model-Assisted Generation

- [ ] 3.1 将 configured model invocation 接入上下文文档、Qwen 策略、治理报告和生成 Skill 的生成路径。
- [ ] 3.2 无模型配置时保留确定性 fallback 生成，并明确标记 fallback 输出。
- [ ] 3.3 实现 JSON schema 校验和 Markdown 章节校验，在写入模型生成产物前执行。
- [ ] 3.4 确保模型请求只使用有边界 evidence，不注入全项目源码。
- [ ] 3.5 增加测试，覆盖 configured model 生成、fallback 标记、校验拒绝和业务 patch 输出阻断。

## 4. Output Package Alignment

- [ ] 4.1 修正 `.ai-context` 文件名为 `qwen32b-system-prompt.md`、`qwen32b-context-policy.md`、`qwen32b-output-format.md`、`qwen32b-plan-do-policy.md` 和 `qwen32b-quality-check.md`。
- [ ] 4.2 增加预期的 `docs/ai/templates` 和 `docs/ai/examples` 输出，或明确将其映射到生成的 index artifacts。
- [ ] 4.3 确保带单一顶层项目目录的 zip 输入会先解析到真实项目根目录再扫描。
- [ ] 4.4 增加资料包级测试，验证完整预期输出布局。

## 5. Generated User AI Coding Guide Skill

- [ ] 5.1 将生成的 `.ai-skill/ai-coding-guide/SKILL.md` 改写为可执行的模型/Agent 工作流。
- [ ] 5.2 增加 `.ai-index`、`.ai-context` 和相关 `docs/ai` 文件的上下文召回说明。
- [ ] 5.3 增加任务类型、页面、路由、API、组件、业务字段、权限和字典的缺失信息确认规则。
- [ ] 5.4 扩展小模型约束，覆盖编造权限、字典、业务字段，以及猜测 API 入参/出参契约。
- [ ] 5.5 增加变更文件识别和 ESLint 回修 prompt 指导。
- [ ] 5.6 增加测试，覆盖生成 Skill 内容和必需工作流章节。

## 6. Documentation and Verification

- [ ] 6.1 更新 README，说明 Skill 驱动的治理模型和确定性 fallback 行为。
- [ ] 6.2 更新 Agent 使用文档，区分 evidence collection、治理 Skills、模型辅助生成和目标工程 AI Coding 使用。
- [ ] 6.3 运行完整测试套件和 TypeScript 校验。
- [ ] 6.4 根据本 change 的 specs 审查生成产物，再标记实现完成。
```

## openspec/changes/skill-driven-context-governance-prd/specs/evidence-package-generation/spec.md

- Source: openspec/changes/skill-driven-context-governance-prd/specs/evidence-package-generation/spec.md
- Lines: 1-29
- SHA256: c62de9ba367b4613105f099a358d8a895188998a3b0a9559f21c840b53c93501

```md
## ADDED Requirements

### Requirement: Evidence package 输出
系统 SHALL 在任何模型辅助上下文生成之前，先通过确定性扫描器生成有边界的 evidence package。

#### Scenario: 项目扫描完成
- **WHEN** 项目识别和源码清单扫描完成
- **THEN** 系统 SHALL 写入可供下游 Skills 消费的结构化 evidence

### Requirement: Evidence 内容
evidence package SHALL 包含项目画像、源码目录、文件树摘要、页面候选、组件候选、API 候选、路由候选、request wrappers、相关代码片段和待确认项。

#### Scenario: 写入 evidence package
- **WHEN** 检查输出内容
- **THEN** evidence package SHALL 暴露项目事实和候选产物，而不要求注入全项目源码

### Requirement: 有边界源码片段
evidence package 中的代码片段 SHALL 受到文件数量、字节数或行数限制。

#### Scenario: 扫描大型项目
- **WHEN** 项目包含大量源码文件
- **THEN** evidence package SHALL 只包含选择后的代码片段，而不是完整源码树

### Requirement: 待确认项跟踪
evidence package SHALL 记录不确定或不完整的发现，而不是静默猜测。

#### Scenario: 扫描器无法识别路由路径或 API 方法
- **WHEN** 扫描器无法可靠抽取必需细节
- **THEN** evidence package SHALL 包含描述缺失或不确定信息的待确认项
```

## openspec/changes/skill-driven-context-governance-prd/specs/generated-ai-coding-guide-skill/spec.md

- Source: openspec/changes/skill-driven-context-governance-prd/specs/generated-ai-coding-guide-skill/spec.md
- Lines: 1-36
- SHA256: 15ce7cdad8b618c812ca52f99e37b23655409a4d17de01be940c176754cefc65

```md
## ADDED Requirements

### Requirement: 生成的引导 Skill 是工作流
生成的用户 AI Coding 引导 Skill SHALL 为目标工程开发任务定义可执行工作流，而不仅是静态说明文本。

#### Scenario: 生成 Skill 文件
- **WHEN** `.ai-skill/ai-coding-guide/SKILL.md` 被写入
- **THEN** 它 SHALL 指导模型或 Agent 如何分类任务、召回上下文、创建计划、请求确认、组装 Qwen prompt，并处理生成后的检查

### Requirement: 上下文召回说明
生成的引导 Skill SHALL 指导模型或 Agent 在生成 Qwen 任务 prompt 前读取 `.ai-index`、`.ai-context` 和相关 `docs/ai` 文件。

#### Scenario: 用户请求编码任务
- **WHEN** 引导 Skill 处理请求
- **THEN** 它 SHALL 在 prompt 组装前召回相关页面、组件、API、路由、模板、规则和 Qwen 策略上下文

### Requirement: 缺失信息确认
当任务类型、页面、路由、API、组件、业务字段、权限或字典值缺失或有歧义时，生成的引导 Skill SHALL 要求用户确认。

#### Scenario: 请求缺少必需字段
- **WHEN** 引导 Skill 无法从生成上下文中确认必需任务信息
- **THEN** 它 SHALL 在生成最终 Qwen prompt 前向用户询问缺失信息

### Requirement: 强小模型约束
生成的 Qwen prompt SHALL 包含约束，禁止编造 import、新增依赖、不存在组件、不存在 API、绕过 request wrapper、编造权限、编造字典、猜测业务字段、猜测 API 入参/出参契约、无关修改和未请求的大重构。

#### Scenario: 组装 Qwen prompt
- **WHEN** 引导 Skill 生成最终 Qwen 任务 prompt
- **THEN** 所有必需小模型约束 SHALL 被包含

### Requirement: 变更文件 ESLint 指导
生成的引导 Skill SHALL 定义如何识别变更前端文件，以及如何执行或指导变更文件 ESLint 检查。

#### Scenario: 代码生成已应用
- **WHEN** 引导 Skill 进入生成后检查阶段
- **THEN** 它 SHALL 使用变更文件识别指导，并在 ESLint 存在错误时生成受约束的回修 prompt
```

## openspec/changes/skill-driven-context-governance-prd/specs/governance-skill-registry/spec.md

- Source: openspec/changes/skill-driven-context-governance-prd/specs/governance-skill-registry/spec.md
- Lines: 1-29
- SHA256: ac353d110304d0e4158a4e9b8e27c9beff4f53645ebed5ec0e1f8cc0dc3e2f56

```md
## ADDED Requirements

### Requirement: 治理 Skill registry 输出
系统 SHALL 将治理 Skill registry 作为上下文资料包的一部分生成。

#### Scenario: 生成上下文资料包
- **WHEN** 治理 Agent 完成一次运行
- **THEN** 输出 SHALL 包含一个 registry，列出所有可供模型或 Agent 编排调用的治理 Skills

### Requirement: Skill 元数据契约
每个治理 Skill 条目 SHALL 声明名称、用途、输入契约、输出契约、是否需要模型、允许动作、禁止动作、校验策略和失败策略。

#### Scenario: 检查 registry
- **WHEN** 用户或模型读取 registry
- **THEN** 每个 Skill SHALL 暴露足够元数据，用于判断它如何被调用以及必须遵守哪些边界

### Requirement: 必需治理 Skills
registry SHALL 至少包含项目识别、源码清单、示例/模板抽取、上下文文档生成、Qwen 上下文策略生成、治理报告生成和用户 AI Coding 引导 Skill 生成。

#### Scenario: 生成 MVP registry
- **WHEN** 系统写入治理 Skill registry
- **THEN** 所有必需治理 Skills SHALL 使用稳定的 kebab-case 名称列出

### Requirement: 禁止业务 patch
治理 Skills SHALL NOT 允许在治理运行期间发起生成或应用业务源码 patch 的模型调用。

#### Scenario: 生成 Skill 元数据
- **WHEN** 某个 Skill 可能涉及模型输出
- **THEN** 它的 forbidden actions SHALL 明确禁止业务 patch 生成和被扫描项目源码修改
```

## openspec/changes/skill-driven-context-governance-prd/specs/model-assisted-context-generation/spec.md

- Source: openspec/changes/skill-driven-context-governance-prd/specs/model-assisted-context-generation/spec.md
- Lines: 1-36
- SHA256: 5f0c431ba252a24aadc6539d3443b8fc96974547c3be5d64f27965f6fa960452

```md
## ADDED Requirements

### Requirement: 模型辅助上下文文档生成
当模型可用时，系统 SHALL 使用 configured model invocation，基于 evidence package 生成叙述性上下文文档。

#### Scenario: 提供 configured model
- **WHEN** evidence 已收集且模型配置完整
- **THEN** 上下文文档 SHALL 通过受控模型调用层生成

### Requirement: 确定性 fallback 标记
当没有配置模型时，系统 MAY 生成确定性 fallback 文档，但这些文档 SHALL 标记为 fallback 输出。

#### Scenario: 未配置模型
- **WHEN** Agent 在没有模型辅助的情况下生成上下文文档
- **THEN** 输出 SHALL 清晰说明这是确定性 fallback 输出

### Requirement: 模型输出校验
系统 SHALL 在写入产物前，对模型生成的 JSON 执行 schema 校验，并对模型生成的 Markdown 执行必需章节模板校验。

#### Scenario: 模型输出格式错误
- **WHEN** 模型输出未通过 schema 或模板校验
- **THEN** 系统 SHALL 拒绝写入该产物，并记录失败或待确认项，而不是写入无效输出

### Requirement: Qwen 策略文件命名
系统 SHALL 使用指定名称写入 Qwen 上下文策略文件：`qwen32b-system-prompt.md`、`qwen32b-context-policy.md`、`qwen32b-output-format.md`、`qwen32b-plan-do-policy.md` 和 `qwen32b-quality-check.md`。

#### Scenario: Qwen 策略生成完成
- **WHEN** `.ai-context` 被写入
- **THEN** 所有必需 Qwen 策略文件 SHALL 使用指定名称存在

### Requirement: 禁止全源码模型注入
模型辅助上下文生成 SHALL 使用有边界 evidence package，SHALL NOT 在单次模型请求中注入完整项目源码或全部已生成文档。

#### Scenario: 准备模型请求
- **WHEN** 系统准备文档或策略生成请求
- **THEN** 请求输入 SHALL 是有边界 evidence，而不是全项目源码文本
```

