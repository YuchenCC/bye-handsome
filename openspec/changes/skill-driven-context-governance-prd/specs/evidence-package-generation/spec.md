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
