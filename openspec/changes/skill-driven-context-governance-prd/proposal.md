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
