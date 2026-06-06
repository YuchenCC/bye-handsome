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
