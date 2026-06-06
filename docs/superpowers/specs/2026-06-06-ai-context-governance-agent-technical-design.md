---
comet_change: ai-context-governance-agent
role: technical-design
canonical_spec: openspec
---

# AI Coding 上下文治理 Agent 技术设计

## 1. 背景

本设计基于 OpenSpec change `ai-context-governance-agent`。OpenSpec 是本变更的需求事实源，本文只补充技术实现方案、架构取舍、风险和测试策略。

目标系统是一个存量前端系统 AI Coding 上下文治理 Agent。它接收单个源码 zip 或本地前端项目目录，识别项目技术栈和工程结构，调用中等粒度 Skills 生成上下文资料包。生成完成后，Agent 工作结束。后续用户将资料包复制到目标工程，再使用生成的用户 AI Coding 引导 Skill 配合 Qwen2.5-Coder-32B 或其他模型进行代码生成。

## 2. 架构方案

采用“治理 Agent 中心化编排 + 中等粒度 Skills + 内部确定性扫描器 + 受控模型归纳”的结构。

```text
源码 zip / 本地项目目录
  ↓
Governance Agent
  ↓
输入解析与临时工作区
  ↓
project-detect-skill
  ↓
source-inventory-skill
  ↓
example-template-skill
  ↓
context-doc-generate-skill
  ↓
user-ai-coding-skill-generate-skill
  ↓
ai-context-package
```

Agent 负责：

- 输入处理和临时工作区管理。
- 统一模型调用配置和调用边界控制。
- 根据项目画像选择 Skill 和内部扫描器。
- 管理扫描结果、模型归纳结果和输出产物。
- 聚合治理报告、异常和待确认事项。

Skill 负责：

- 接收有限输入。
- 产出固定 schema 的结构化中间结果或固定模板文档。
- 声明是否需要模型归纳，以及对应输入和输出 schema。

内部扫描器负责：

- 目录遍历、依赖解析、文件发现。
- 页面、路由、组件、API、request 封装、模板候选的确定性提取。
- 按 Vue2、Vue3、React、Umi 等技术栈切换解析策略。

## 3. Skill 边界

对外暴露 5 个中等粒度 Skill：

- `project-detect-skill`：识别技术栈、依赖、命令、目录、构建工具、UI 框架、请求层、路由方式、样式方案和质量配置。
- `source-inventory-skill`：扫描页面、路由、组件、接口、request 封装和基础页面-接口关系。
- `example-template-skill`：抽取典型页面、组件、service、路由、权限、字典示例和模板。
- `context-doc-generate-skill`：生成中文 `docs/ai`、`.ai-index` 和 `.ai-context`。
- `user-ai-coding-skill-generate-skill`：生成 `.ai-skill/ai-coding-guide` 用户引导 Skill。

不把 Vue2、Vue3、React、Umi 扫描器暴露成独立 Skill。它们作为内部扫描器由项目画像驱动选择。这样可以降低 Agent 调度复杂度，同时保留不同技术栈的解析能力。

## 4. 模型调用设计

治理 Agent 会调用大模型，但只用于上下文治理相关任务：

- 页面用途和页面类型归纳。
- 组件用途说明。
- 模板说明和适用场景总结。
- AI Coding 规则归纳。
- 中文文档成文。
- `.ai-context` 策略文本生成。
- 用户 AI Coding 引导 Skill 生成。

治理 Agent 不得调用模型生成业务代码 patch，不得让模型修改被扫描项目源码。

模型调用统一由 Agent 编排层管理。Skill 不直接持有 API Key，也不自行调用模型。Skill 只声明模型任务的输入、输出 schema 和失败策略。

支持两种模型来源：

- 显式模型配置：通过 `provider`、`model`、`baseUrl`、`apiKey` 调用 GPT 类模型或 Qwen2.5-Coder-32B。
- 当前会话模型：复用当前使用场景内的模型能力，例如 Codex CLI 当前交互会话。该模式适合交互式运行。

模型调用流程：

```text
确定性扫描结果
  ↓
Agent 选择有限上下文片段
  ↓
组装模型任务输入
  ↓
统一模型客户端或当前会话模型
  ↓
校验 JSON schema / Markdown 模板
  ↓
写入文档、索引、策略或 Skill
```

如果远程模型未配置且当前会话模型不可用，Agent 必须中止需要模型归纳的步骤，或将对应内容记录为待确认事项，不得伪造结果。

## 5. 输出设计

最终输出为独立 `ai-context-package`，不直接写入被扫描项目源码目录。

```text
ai-context-package/
  docs/ai/
  .ai-index/
  .ai-context/
  .ai-skill/ai-coding-guide/
```

`docs/ai` 面向人阅读，默认中文。`.ai-index` 面向机器检索和上下文拼接。`.ai-context` 面向 Qwen2.5-Coder-32B，提供固定规则、输出格式、plan-do 策略和质量回检策略。`.ai-skill/ai-coding-guide` 是用户复制到目标工程后使用的 AI Coding 引导 Skill。

需要额外提供治理 Agent 自身使用文档，说明：

- 安装和前置条件。
- zip 和本地目录输入方式。
- 运行流程。
- 输出目录解释。
- 如何查看治理报告。
- 如何复制上下文资料包到目标工程。
- 常见问题和故障处理。

该文档与 `docs/ai/AI_CODING_USER_GUIDE.md` 分离。前者面向运行治理 Agent 的人，后者面向目标工程内进行 AI Coding 的开发者。

## 6. 用户 AI Coding 引导 Skill

生成的用户引导 Skill 必须采用 plan-do 工作原则：

1. 解析用户简单需求。
2. 识别任务类型。
3. 读取 `.ai-index` 和 `.ai-context`。
4. 召回相关页面、组件、接口、模板和规则。
5. 检查缺失字段并请求确认。
6. 生成变更计划。
7. 用户确认计划。
8. 生成 Qwen2.5-Coder-32B 适配提示词。
9. 用户或模型应用代码变更后，识别 Git 变更文件。
10. 执行或指导执行变更文件 ESLint。
11. 根据 ESLint 结果生成回修提示。

小模型约束必须进入提示词：

- 只能使用上下文中出现过的组件、工具函数和 API 风格。
- 不得发明不存在的 import。
- 不得新增第三方依赖。
- 不得编造组件、接口、权限、字典或字段。
- 字段不确定时使用 `TODO`。
- 不得绕过项目 request 封装。
- 不得修改无关文件。
- 不得做未要求的大范围重构。

## 7. 风险与应对

- 旧项目结构不规范：输出待确认事项，允许用户人工修正后重跑。
- 扫描器误判技术栈：保留项目画像中的证据来源，并在冲突时写入治理报告。
- 模型归纳产生幻觉：模型输入只来自确定性扫描结果，输出必须通过 schema 或模板校验。
- 上下文过长：`.ai-index` 精准召回，`.ai-context` 限制每次任务注入数量。
- 当前会话模型不可自动程序化调用：Agent 使用文档明确当前会话模型模式的交互边界。
- Agent 使用文档和目标工程使用文档混淆：文档命名、章节和输出路径明确区分治理阶段与 AI Coding 阶段。

## 8. 测试策略

- 输入测试：覆盖源码 zip 和本地项目目录。
- 项目识别测试：覆盖 Vue2、Vue3、React、Umi 和 `jupui => Vue2`。
- 扫描测试：覆盖页面、路由、组件、API、request 封装和模板候选。
- 模型调用测试：覆盖 API 模型配置、当前会话模型模式、输出 schema 校验、失败重试和业务 patch 阻断。
- 输出测试：对 `docs/ai`、`.ai-index`、`.ai-context`、`.ai-skill/ai-coding-guide` 做结构或快照校验。
- OpenSpec 校验：持续运行 `npx openspec validate ai-context-governance-agent`。

## 9. Spec Patch

本阶段已回写 OpenSpec delta specs：

- 新增 `agent-usage-documentation` capability。
- 新增 `controlled-model-invocation` capability。
- 在 `context-governance-agent` 中补充 Agent 使用文档和受控模型调用边界。

