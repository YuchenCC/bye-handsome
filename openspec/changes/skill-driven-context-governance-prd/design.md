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
