## 1. Skill Registry

- [x] 1.1 定义治理 Skill 元数据类型，包含 name、purpose、inputs、outputs、model requirement、allowed actions、forbidden actions、validation policy 和 failure policy。
- [x] 1.2 实现 registry 生成器，列出项目识别、源码清单、示例/模板抽取、上下文文档生成、Qwen 策略生成、治理报告生成和用户 AI Coding 引导 Skill 生成。
- [x] 1.3 使用稳定路径和稳定格式将 registry 写入上下文资料包。
- [x] 1.4 增加测试，验证必需 Skills 和业务 patch 禁止项存在于 registry 中。

## 2. Evidence Package

- [x] 2.1 定义 evidence package schema，包含项目画像、source dirs、文件树摘要、候选清单、代码片段和待确认项。
- [x] 2.2 将 scanner 输出改造成有边界的 evidence，同时保留当前基础扫描行为。
- [x] 2.3 为代码片段选择增加文件数量、字节数或行数限制。
- [x] 2.4 持久化路由、API、组件 props、request wrapper、权限、字典和模板相关的待确认项。
- [x] 2.5 增加测试，覆盖 evidence package 结构、有边界 snippets 和待确认项输出。

## 3. Model-Assisted Generation

- [x] 3.1 将 configured model invocation 接入上下文文档、Qwen 策略、治理报告和生成 Skill 的生成路径。
- [x] 3.2 无模型配置时保留确定性 fallback 生成，并明确标记 fallback 输出。
- [x] 3.3 实现 JSON schema 校验和 Markdown 章节校验，在写入模型生成产物前执行。
- [x] 3.4 确保模型请求只使用有边界 evidence，不注入全项目源码。
- [x] 3.5 增加测试，覆盖 configured model 生成、fallback 标记、校验拒绝和业务 patch 输出阻断。

## 4. Output Package Alignment

- [x] 4.1 修正 `.ai-context` 文件名为 `qwen32b-system-prompt.md`、`qwen32b-context-policy.md`、`qwen32b-output-format.md`、`qwen32b-plan-do-policy.md` 和 `qwen32b-quality-check.md`。
- [x] 4.2 增加预期的 `docs/ai/templates` 和 `docs/ai/examples` 输出，或明确将其映射到生成的 index artifacts。
- [x] 4.3 确保带单一顶层项目目录的 zip 输入会先解析到真实项目根目录再扫描。
- [x] 4.4 增加资料包级测试，验证完整预期输出布局。

## 5. Generated User AI Coding Guide Skill

- [x] 5.1 将生成的 `.ai-skill/ai-coding-guide/SKILL.md` 改写为可执行的模型/Agent 工作流。
- [x] 5.2 增加 `.ai-index`、`.ai-context` 和相关 `docs/ai` 文件的上下文召回说明。
- [x] 5.3 增加任务类型、页面、路由、API、组件、业务字段、权限和字典的缺失信息确认规则。
- [x] 5.4 扩展小模型约束，覆盖编造权限、字典、业务字段，以及猜测 API 入参/出参契约。
- [x] 5.5 增加变更文件识别和 ESLint 回修 prompt 指导。
- [x] 5.6 增加测试，覆盖生成 Skill 内容和必需工作流章节。

## 6. Documentation and Verification

- [x] 6.1 更新 README，说明 Skill 驱动的治理模型和确定性 fallback 行为。
- [x] 6.2 更新 Agent 使用文档，区分 evidence collection、治理 Skills、模型辅助生成和目标工程 AI Coding 使用。
- [x] 6.3 运行完整测试套件和 TypeScript 校验。
- [x] 6.4 根据本 change 的 specs 审查生成产物，再标记实现完成。
