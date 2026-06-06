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

### Decision 8: 统一模型调用层

模型调用由治理 Agent 编排层统一管理，Skill 不应各自随意持有 API Key 或直接调用模型。Skill 可以声明模型归纳所需的输入、输出 schema 和失败处理策略，Agent 负责选择模型来源、调用模型、校验输出并将结果交还给 Skill。

模型来源支持两类：

- 显式模型配置：通过 provider、model、baseUrl、apiKey 等参数调用远程模型，适配 GPT 类模型和 Qwen2.5-Coder-32B。
- 当前会话模型：复用当前使用场景内的模型能力，例如 Codex CLI 当前会话。该模式适合交互式运行，由 Agent 将模型归纳任务交给当前会话完成。

模型调用优先级由运行配置决定。若未配置远程模型且当前会话模型不可用，Agent 必须中止需要模型归纳的步骤或输出明确待确认事项，不得伪造模型结果。

### Decision 9: 模型输出必须结构化校验

所有模型输出必须符合 JSON schema 或固定 Markdown 模板。Agent 必须校验输出结构，失败时允许有限重试；重试后仍失败时，将该部分记录为异常或待确认事项。

## Risks / Trade-offs

- 扫描旧项目结构不规范 → 输出待确认事项，并允许后续人工补充或修正索引。
- 组件 props、接口入参出参无法可靠解析 → 在上下文文档中标记不确定项，用户引导 Skill 不得猜测。
- 上下文资料过长导致 Qwen 输出不稳定 → `.ai-index` 用于精准召回，`.ai-context` 限制每次任务注入最小必要上下文。
- 中等粒度 Skill 仍可能覆盖较多职责 → Skill 内部使用确定性扫描器和固定输出 schema 降低模型推理压力。
- 用户复制资料包后路径不一致 → 用户引导 Skill 需要检查必需目录存在性，并在缺失时给出明确修复提示。
- Agent 使用文档与用户引导文档混淆 → 文档命名和章节必须明确区分治理阶段与目标工程使用阶段。
- 模型归纳产生幻觉或格式漂移 → 输入必须来自确定性扫描结果，输出必须通过 schema 或模板校验，失败时进入待确认事项。
- 当前会话模型不可自动程序化调用 → Agent 使用文档必须说明当前会话模型模式的使用前提和人工确认边界。

## Migration Plan

1. 基于本 change 建立 Agent、Skill、上下文资料包和用户 Skill 的规格。
2. 后续 build 阶段按任务实现 MVP。
3. MVP 完成后使用样例前端项目验证 zip 输入和本地目录输入。
4. 验证通过后归档 OpenSpec delta specs 到主规格。

## Open Questions

- 用户引导 Skill 的实际安装路径是否需要适配多个 agent 平台。
- `.ai-index` JSON schema 是否需要单独发布版本号。
- ESLint 回检是否需要提供 Node 脚本实现，还是第一版仅提供命令和流程说明。
