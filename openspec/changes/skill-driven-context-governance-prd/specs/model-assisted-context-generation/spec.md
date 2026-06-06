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
