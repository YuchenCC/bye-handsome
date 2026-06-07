---
comet_change: close-spec-gaps
role: technical-design
canonical_spec: openspec
---

# Close Spec Gaps 技术设计

## Context

`close-spec-gaps` 是一次规格差距修复，不重新定义产品范围。当前实现已经能生成预期的上下文包目录结构，并通过现有测试，但对照 `docs/superpowers/specs` 和 OpenSpec delta specs 后，存在若干“骨架完成但行为不足”的问题：

- inventory 主要是文件路径清单，路由、API、组件 props、权限、字典和 request wrapper 细节不足。
- `.evidence/snippets.json` 有限制字段，但 snippet `content` 为空。
- JSON schema 校验能力存在，但没有系统性接入 `.evidence` 和 `.ai-index` 写入。
- 模型 Markdown 校验失败时缺少可审计的失败记录。
- fallback 标记只出现在个别产物内，没有在治理报告中汇总。
- Qwen 输出策略需要更明确地绑定 plan-do 确认和任务范围。

OpenSpec 仍是能力规格事实源。本文只说明实现方案、取舍、风险和测试策略。

## Goals

- 用保守确定性扫描补齐可可靠抽取的项目画像和源码清单语义。
- 将无法可靠确认的事实写入结构化 unresolved items，而不是静默缺失或猜测。
- 为 evidence snippets 写入真实、有界、可追溯的源码片段。
- 在写入已知 JSON 产物前执行 Zod schema 校验。
- 对模型产物记录 `model`、`fallback`、`failed` 状态，并汇总到治理报告。
- 统一小模型约束文本，避免 `docs/ai`、`.ai-context`、`.ai-index/rules.json` 和生成 Skill 之间漂移。
- 通过回归测试证明本轮差距被关闭。

## Non-Goals

- 不实现全量 AST 级语义理解。
- 不让治理 Agent 生成或应用业务代码 patch。
- 不修改被扫描项目源码。
- 不扩展到 monorepo、Next.js、Nuxt、Angular、小程序或多项目治理。
- 不在治理阶段执行目标项目 build、typecheck 或 ESLint。

## Architecture

保持现有主流程不变：

```text
CLI
  -> prepareWorkspace
  -> project-detect-skill
  -> source-inventory-skill
  -> example-template-skill
  -> context-doc-generate-skill
  -> user-ai-coding-skill-generate-skill
```

本轮改动集中在事实层和产物写入边界：

```text
Deterministic scanners
  -> structured profile/inventory
  -> structured unresolved items
  -> bounded snippet reader
  -> schema-validated .evidence/.ai-index
  -> generation status aware docs/report/policies
```

## Decisions

### 1. Scanner 保持确定性和保守

Scanner 只抽取常见、可验证模式：

- Vue Router、React Router、Umi route config 中的静态路径。
- axios/request/fetch 常见调用里的 HTTP method 和 URL 字符串。
- Vue Options API props、Vue `defineProps`、React TypeScript props 类型名或字段。
- request wrapper 文件和导入引用。
- 页面 import 或引用 service/API 文件的关系。

抽取不到或存在复杂动态表达式时，不猜测，写 unresolved item。

### 2. Unresolved items 升级为结构化事实

保留现有 message 能力，但新增结构化字段：

- `source`
- `category`
- `filePath`
- `message`
- `severity`

分类至少覆盖 route、api、component-props、request-wrapper、permission、dictionary、business-field、model-generation、schema-validation。

### 3. Evidence snippets 从候选文件读取真实内容

`buildEvidencePackage` 需要改为异步或拆分出异步 snippet builder。选择顺序稳定，优先级建议为：

1. request wrappers
2. routes
3. APIs/services
4. pages
5. components
6. templates/examples

必须执行：

- max files
- max lines per file
- max bytes per file
- max total bytes
- truncated 标记

超出限制的文件只保留 candidate path，不写入完整内容。

### 4. JSON 校验靠近写入边界

`writePackageJson` 保持低层通用写入函数。上层新增 typed writer 或在 `contextDocGenerateSkill` 中集中校验已知 artifact：

- `.evidence/project-profile.json`
- `.evidence/file-tree.json`
- `.evidence/candidates/*.json`
- `.evidence/snippets.json`
- `.evidence/unresolved-items.json`
- `.ai-index/*.json`

schema mismatch 时不得写入无效 artifact，必须记录 failure。

### 5. 生成状态显式化

模型辅助产物统一记录状态：

- `model`：模型输出通过校验并被采用。
- `fallback`：模型不可用，采用确定性 fallback。
- `failed`：模型输出无效或请求失败，未写入无效输出。

治理报告增加“生成状态”章节，列出 fallback 和 failed artifact。必要时新增机器可读 `.evidence/generation-status.json`，以便测试和后续自动化消费。

### 6. 小模型约束集中维护

将约束列表集中到模板层的单一来源，再渲染到：

- `docs/ai/ai-coding-rules.md`
- `.ai-index/rules.json`
- `.ai-context/qwen32b-context-policy.md`
- `.ai-context/qwen32b-output-format.md`
- `.ai-skill/ai-coding-guide/SKILL.md`

约束必须覆盖 import、依赖、组件、API、request wrapper、权限、字典、业务字段、API 入参/出参、无关修改和大重构。

## Testing Strategy

先补当前实现会失败的回归测试：

- snippets 中候选文件 content 不得为空，并验证 truncation。
- route/API/props/request wrapper 常见模式可抽取。
- request wrapper 缺失、API method/path 缺失、props 无法解析、权限/字典不明确时写 unresolved items。
- JSON schema 不匹配时拒写并记录失败。
- 模型 Markdown 缺章节或包含业务 patch 时不写入无效输出，并进入治理报告或 unresolved items。
- fallback artifact 在文件内和 governance report 中都可见。
- Qwen output policy 明确要求 plan-do 确认、scope、TODO 和 no unrelated edits。

最终验证命令：

```bash
npm test
npm run build
node_modules/.bin/openspec.cmd validate close-spec-gaps
```

再使用至少一个 fixture 运行生成流程，人工检查 `.evidence`、`.ai-index`、`.ai-context`、`.ai-skill` 和治理报告。

## Risks

- 静态抽取误判：通过 confidence/evidence 字段和 unresolved items 降低风险。
- snippets 泄露过多源码：通过文件数、行数、单文件字节数和总字节数限制控制。
- schema 校验暴露现有 fixture 不完整：优先修正 fixture 和生成逻辑，不放宽 schema。
- partial failure 让写入流程复杂：先计算 artifact、validation result 和 generation status，再并行写入有效产物。

## Spec Patch

本阶段不需要新增 OpenSpec delta spec。`close-spec-gaps` 已包含以下 capability specs：

- `scanner-semantic-inventory`
- `bounded-evidence-snippets`
- `generation-validation-and-failure-reporting`
- `qwen-policy-scope-alignment`
