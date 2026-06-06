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
