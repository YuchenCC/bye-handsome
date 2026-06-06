## ADDED Requirements

### Requirement: 治理 Skill registry 输出
系统 SHALL 将治理 Skill registry 作为上下文资料包的一部分生成。

#### Scenario: 生成上下文资料包
- **WHEN** 治理 Agent 完成一次运行
- **THEN** 输出 SHALL 包含一个 registry，列出所有可供模型或 Agent 编排调用的治理 Skills

### Requirement: Skill 元数据契约
每个治理 Skill 条目 SHALL 声明名称、用途、输入契约、输出契约、是否需要模型、允许动作、禁止动作、校验策略和失败策略。

#### Scenario: 检查 registry
- **WHEN** 用户或模型读取 registry
- **THEN** 每个 Skill SHALL 暴露足够元数据，用于判断它如何被调用以及必须遵守哪些边界

### Requirement: 必需治理 Skills
registry SHALL 至少包含项目识别、源码清单、示例/模板抽取、上下文文档生成、Qwen 上下文策略生成、治理报告生成和用户 AI Coding 引导 Skill 生成。

#### Scenario: 生成 MVP registry
- **WHEN** 系统写入治理 Skill registry
- **THEN** 所有必需治理 Skills SHALL 使用稳定的 kebab-case 名称列出

### Requirement: 禁止业务 patch
治理 Skills SHALL NOT 允许在治理运行期间发起生成或应用业务源码 patch 的模型调用。

#### Scenario: 生成 Skill 元数据
- **WHEN** 某个 Skill 可能涉及模型输出
- **THEN** 它的 forbidden actions SHALL 明确禁止业务 patch 生成和被扫描项目源码修改
