# 存量前端系统 AI Coding 上下文治理 Agent 需求说明书

## 1. 文档信息

| 项目 | 内容 |
| --- | --- |
| 文档名称 | 存量前端系统 AI Coding 上下文治理 Agent 需求说明书 |
| 文档版本 | V1.0 |
| 日期 | 2026-06-06 |
| 目标模型 | Qwen2.5-Coder-32B，兼容 GPT 类模型 |
| 适用范围 | 存量前端系统、旧前端项目、待接入 AI Coding 的业务系统 |
| 主要使用对象 | 前端开发人员、系统负责人、前端技术小组、项目管理人员 |

## 2. 产品定位

本项目建设一个“存量前端系统 AI Coding 上下文治理 Agent”。Agent 不负责直接调用 Qwen2.5-Coder-32B 生成代码，也不负责修改用户业务工程代码。Agent 的职责是读取一个存量前端项目源码 zip 或本地项目目录，根据项目技术栈和目录结构选择对应工作流与 Skill，生成可复制到目标工程中的 AI Coding 上下文资料包，以及一个可复制的用户 AI Coding 引导 Skill。

生成完成后，治理 Agent 的工作即完成。后续用户将上下文资料包和用户引导 Skill 复制到自己的工程目录中，再使用该引导 Skill 配合 Qwen2.5-Coder-32B 进行 AI Coding。

## 3. 背景与问题

存量前端系统普遍存在文档缺失、技术栈混杂、组件和接口规则分散、页面与路由关系不清晰、构建和全量检查成本高等问题。直接让中小规模代码模型基于自然语言生成代码，容易出现编造组件、编造接口、乱 import、修改范围过大、字段猜测和代码风格不一致等风险。

因此，需要一套面向 AI Coding 的上下文治理工作流，将旧系统中的页面、组件、接口、路由、权限、字典、模板和编码规则转化为模型可检索、可拼接、可约束的上下文资产。

## 4. 项目目标

### 4.1 总体目标

建设一套可复制的“存量前端系统 AI Coding 上下文治理 Agent + Skills”能力，面向 Qwen2.5-Coder-32B 生成短上下文、强结构、强约束、高相关样例的上下文资料包，降低旧前端项目接入 AI Coding 的成本和风险。

### 4.2 具体目标

- 支持输入单个源码 zip 或单个本地项目目录。
- 自动识别项目技术栈、工程结构、构建命令、依赖、目录和代码规范。
- 根据项目画像选择对应扫描策略和 Skill 组合。
- 自动生成中文 `docs/ai` 人读文档。
- 自动生成 `.ai-index` 机器检索索引。
- 自动生成 `.ai-context` Qwen2.5-Coder-32B 专用上下文策略。
- 自动生成可复制的用户 AI Coding 引导 Skill。
- 在用户引导 Skill 中内置 plan-do 工作原则、小模型约束、上下文召回、提示词生成和变更文件 ESLint 回检流程。

## 5. 非目标范围

MVP 不解决以下问题：

- 不直接调用 Qwen2.5-Coder-32B 生成业务代码。
- 不直接修改用户业务工程。
- 不默认执行全量 build。
- 不默认执行全量 typecheck。
- 不治理全部历史代码质量问题。
- 不承诺模型完全自动完成复杂业务开发。
- 不支持大规模架构重构自动生成。
- 不替代人工 Code Review、业务确认和安全评审。
- 不处理后端接口设计和数据库设计。
- 不强制统一所有存量系统工程结构。

## 6. MVP 输入范围

### 6.1 支持输入

- 单个前端项目源码 zip。
- 单个本地前端项目目录。

### 6.2 支持项目类型

- Vue2。
- Vue3。
- React。
- Umi。
- Webpack。
- Vite。
- Vue CLI。
- JS / TS 混合项目。

### 6.3 特殊识别规则

当项目依赖中解析出 `jupui` 时，项目按 Vue2 技术栈处理。该规则优先级高于普通 Vue 版本信号，用于适配特定存量项目生态。

### 6.4 暂不保证完整治理

- monorepo 多应用自动拆分。
- Next.js。
- Nuxt。
- Angular。
- 小程序。
- 纯组件库。
- 多项目批量治理。

## 7. 设计原则

### 7.1 Agent 只做上下文治理

治理 Agent 只负责生成 AI Coding 适配的上下文文档和用户引导 Skill。代码生成、代码修改和 ESLint 回检发生在用户后续使用用户引导 Skill 的阶段。

### 7.2 面向 Qwen2.5-Coder-32B 优化

上下文资料必须适配 32B 级代码模型的能力边界：

- 短上下文。
- 强结构。
- 强约束。
- 高相关样例。
- 明确禁止事项。
- 明确输出格式。
- 明确 plan-do 工作原则。
- 明确轻量质量回检规则。

### 7.3 不让模型自由发挥

用户引导 Skill 生成的 Qwen 任务必须基于已生成的上下文资料，不允许模型脱离项目上下文自由编造代码。

### 7.4 对外 Skill 中等粒度，内部扫描器可细分

对外暴露的 Skill 保持中等粒度，降低 Agent 编排复杂度。Skill 内部可以按 Vue2、Vue3、React、Umi 等技术栈细分扫描器，但 MVP 不将所有扫描器暴露为独立 Skill。

### 7.5 中文文档优先

所有面向人阅读的文档默认使用中文。`.ai-index` 可使用稳定英文 key，字段值和说明以中文为主，兼顾程序消费和团队阅读。

## 8. 总体工作流

```text
输入源码 zip 或本地项目目录
  ↓
治理 Agent 创建临时工作区或读取目标目录
  ↓
调用 project-detect-skill 生成项目画像
  ↓
Agent 根据项目画像选择 Vue2 / Vue3 / React / Umi 扫描策略
  ↓
调用 source-inventory-skill 生成页面、路由、组件、接口清单
  ↓
调用 example-template-skill 抽取典型示例和模板
  ↓
调用 context-doc-generate-skill 生成 docs/ai、.ai-index、.ai-context
  ↓
调用 user-ai-coding-skill-generate-skill 生成用户 AI Coding 引导 Skill
  ↓
输出 ai-context-package
  ↓
Agent 工作完成
```

## 9. Agent 职责

治理 Agent 负责：

- 接收源码 zip 或本地项目目录。
- 对 zip 输入进行解压和临时工作区管理。
- 调用项目识别 Skill，生成项目画像。
- 根据项目画像选择后续 Skill 组合和扫描策略。
- 管理 Skill 调用顺序。
- 汇总扫描结果。
- 生成上下文资料包。
- 记录异常、缺失项和待人工确认事项。
- 输出最终治理报告。

治理 Agent 不负责：

- 直接生成业务代码。
- 直接调用 Qwen2.5-Coder-32B。
- 修改被扫描项目源码。
- 执行用户后续 AI Coding 任务。

## 10. Skill 架构

### 10.1 project-detect-skill

负责识别项目基础画像。

输入：

- `package.json`。
- lock 文件。
- 配置文件。
- `src` 目录。
- README 或已有文档。

识别内容：

- 技术栈：Vue2、Vue3、React、Umi。
- 构建工具：Webpack、Vite、Vue CLI、Umi。
- UI 框架：Ant Design、Element UI、Vant、自研组件、`jupui`。
- 状态管理：Vuex、Pinia、Redux、model、hooks。
- 请求方式：axios、request、umi-request、fetch。
- 路由方式：静态路由、动态路由、后端菜单。
- 样式方案：less、scss、css module、unocss。
- 代码规范：ESLint、Prettier、tsconfig。
- 工程命令：dev、build、lint、test。

输出：

- `project-profile` 结构化结果。
- 待确认事项。
- 推荐扫描策略。

### 10.2 source-inventory-skill

负责根据项目画像扫描基础源码清单。

扫描内容：

- 页面清单。
- 路由清单。
- 组件清单。
- 接口清单。
- request 封装。
- service/api 文件。
- 页面与接口引用关系的基础映射。
- 权限和字典规则的可识别线索。

输出：

- 页面结构化清单。
- 路由结构化清单。
- 组件结构化清单。
- 接口结构化清单。
- 扫描不完整或需人工确认的项目。

### 10.3 example-template-skill

负责抽取典型示例和模板，为后续 Qwen 代码生成提供高相关参考。

抽取内容：

- 列表页示例。
- 详情页示例。
- 新增/编辑表单示例。
- 弹窗表单示例。
- 字典下拉示例。
- 表格操作列示例。
- 权限按钮示例。
- service 示例。
- 路由配置示例。
- 公共组件使用示例。

每个模板应包含：

- 适用场景。
- 推荐参考文件。
- 必须复用组件。
- 标准代码骨架或片段。
- 命名规则。
- 禁止事项。
- 待确认事项。

### 10.4 context-doc-generate-skill

负责将结构化扫描结果生成上下文资料包。

生成内容：

- `docs/ai` 中文人读文档。
- `.ai-index` 机器检索索引。
- `.ai-context` Qwen2.5-Coder-32B 固定上下文策略。
- 治理报告。

### 10.5 user-ai-coding-skill-generate-skill

负责生成可复制的用户 AI Coding 引导 Skill 目录。

该 Skill 生成的是后续用户在目标工程中使用的 Skill，不是治理 Agent 自身执行的代码生成能力。

生成内容：

- `.ai-skill/ai-coding-guide/SKILL.md`。
- `.ai-skill/ai-coding-guide/templates/*.md`。
- `.ai-skill/ai-coding-guide/checks/*.md` 或脚本说明。
- 用户安装和使用说明。

## 11. 输出产物

Agent 输出一个独立上下文资料包：

```text
ai-context-package/
  docs/
    ai/
      README_AI.md
      system-profile.md
      page-inventory.md
      component-inventory.md
      api-inventory.md
      route-permission-map.md
      ai-coding-rules.md
      AI_CODING_USER_GUIDE.md
      governance-report.md
      templates/
      examples/
  .ai-index/
    project-profile.json
    pages.json
    components.json
    apis.json
    routes.json
    templates.json
    examples.json
    rules.json
  .ai-context/
    qwen32b-system-prompt.md
    qwen32b-context-policy.md
    qwen32b-output-format.md
    qwen32b-plan-do-policy.md
    qwen32b-quality-check.md
  .ai-skill/
    ai-coding-guide/
      SKILL.md
      templates/
      checks/
```

## 12. docs/ai 文档要求

`docs/ai` 面向开发者和系统负责人阅读，所有内容使用中文。

必选文档：

- `README_AI.md`：上下文资料包说明。
- `system-profile.md`：系统画像，包含技术栈、构建工具、工程命令、目录结构。
- `page-inventory.md`：页面清单，包含页面名称、路径、路由、页面类型、关联组件和接口。
- `component-inventory.md`：组件清单，包含组件名称、路径、props、事件、使用场景、引用页面。
- `api-inventory.md`：接口清单，包含方法名、路径、请求方式、入参、出参、调用页面。
- `route-permission-map.md`：路由和权限线索说明。
- `ai-coding-rules.md`：当前项目 AI Coding 规则。
- `AI_CODING_USER_GUIDE.md`：用户接入和使用说明。
- `governance-report.md`：治理报告，包含扫描结果、缺失项、异常和待确认事项。

## 13. .ai-index 索引要求

`.ai-index` 面向用户引导 Skill 检索和上下文拼接。JSON key 保持稳定英文命名，字段值和说明以中文为主。

索引应支持：

- 根据页面名称、路由、文件路径召回页面。
- 根据组件名称、props、引用关系召回组件。
- 根据接口方法名、请求路径、调用页面召回接口。
- 根据任务类型召回模板和示例。
- 根据项目画像选择 Qwen 上下文策略。

## 14. .ai-context 策略要求

`.ai-context` 面向 Qwen2.5-Coder-32B，提供固定规则和输出约束。

必须包含：

- 系统提示词。
- 上下文选择策略。
- 输出格式要求。
- plan-do 工作原则。
- 小模型约束。
- 质量回检策略。

上下文选择策略：

- 每次任务注入 1 份 AI Coding 规则。
- 每次任务注入 1 份任务模板。
- 每次任务注入 1 至 2 个相似页面。
- 每次任务注入 1 至 3 个相关组件示例。
- 每次任务注入 1 至 2 个相关 service 示例。
- 每次任务注入 1 份质量检查规则。
- 禁止一次性注入全量项目文档或全量代码。

## 15. 用户 AI Coding 引导 Skill

### 15.1 定位

用户 AI Coding 引导 Skill 是开发者与 Qwen2.5-Coder-32B 之间的桥梁。它不由治理 Agent 执行代码生成，而是在用户复制上下文资料包到目标工程后，由用户调用。

### 15.2 工作原则

用户引导 Skill 采用 plan-do 原则：

1. 先理解和确认任务。
2. 再召回上下文。
3. 先生成变更计划。
4. 用户确认或补充缺失信息。
5. 再生成 Qwen 任务提示词。
6. Qwen 输出 patch 或代码变更。
7. 对变更文件执行 ESLint 轻量回检。
8. 根据 ESLint 结果生成回修提示。

### 15.3 支持任务类型

MVP 支持：

- 新增列表页。
- 修改已有页面。
- 接入接口。
- 修复报错。

后续扩展：

- 新增详情页。
- 新增表单页。
- 新增组件。
- 生成测试用例。
- 补充文档。
- 解释代码。
- 生成页面-操作-接口映射。

### 15.4 交互流程

```text
用户输入简单需求
  ↓
用户引导 Skill 识别任务类型
  ↓
抽取页面、字段、接口、路由、操作等关键信息
  ↓
检查缺失字段并向用户确认
  ↓
读取 .ai-index 和 .ai-context
  ↓
召回相关页面、组件、接口、模板和规则
  ↓
生成 plan
  ↓
用户确认 plan
  ↓
生成 Qwen32B 适配任务提示词
  ↓
Qwen 输出 patch 或代码
  ↓
识别变更文件
  ↓
执行变更文件 ESLint
  ↓
输出检查结果和回修提示
```

### 15.5 小模型约束

用户引导 Skill 生成的 Qwen 任务必须包含以下约束：

- 只能使用上下文中出现过的组件、工具函数、API 风格。
- 不得发明不存在的 import。
- 不得新增第三方依赖。
- 不得编造项目中不存在的组件。
- 不得编造接口方法。
- 不得绕过项目 request 封装。
- 不得编造权限、字典或业务字段。
- 字段不确定时必须使用 `TODO` 标记。
- 不得猜测后端接口入参和出参。
- 修改已有文件时优先输出 patch。
- 不得修改无关文件。
- 不得做未要求的大范围重构。
- 必须输出待确认事项。
- 必须输出变更文件 ESLint 回检建议。

### 15.6 ESLint 回检

ESLint 回检属于用户引导 Skill 的后置步骤，不属于治理 Agent 阶段。

默认策略：

- 只检查本次变更文件。
- 默认文件类型：`.js`、`.jsx`、`.ts`、`.tsx`、`.vue`。
- 默认不执行全量 build。
- 默认不执行全量 typecheck。
- 若无变更文件，应明确提示无需检查。
- 若 ESLint 存在 error，应生成回修提示供 Qwen 或开发者处理。

变更文件识别方式：

- `git diff --name-only --diff-filter=ACMRTUXB`。
- `git diff --cached --name-only --diff-filter=ACMRTUXB`。
- 可配置相对目标分支，例如 `origin/sit...HEAD`。

## 16. 异常与待确认处理

Agent 和 Skill 遇到不确定信息时，不得静默猜测。

必须输出待确认事项：

- 无法识别技术栈。
- 无法识别页面目录。
- 无法识别路由配置。
- 无法识别 request 封装。
- 接口路径或方法名不完整。
- 组件 props 无法可靠解析。
- 权限或字典规则无法确认。
- 模板抽取样例不足。

## 17. MVP 验收标准

### 17.1 输入验收

- 可以处理单个源码 zip。
- 可以处理单个本地项目目录。
- 可以识别 Vue2、Vue3、React、Umi 中至少一种项目类型。
- 当依赖包含 `jupui` 时，项目被识别为 Vue2 技术栈。

### 17.2 Agent 验收

- Agent 能根据项目画像选择后续 Skill 组合。
- Agent 能生成独立 `ai-context-package`。
- Agent 不修改被扫描项目源码。
- Agent 不调用 Qwen 生成业务代码。
- Agent 能输出治理报告和待确认事项。

### 17.3 文档产物验收

- 成功生成中文 `docs/ai` 文档。
- 成功生成 `.ai-index` JSON 索引。
- 成功生成 `.ai-context` Qwen 策略文档。
- 成功生成 `.ai-skill/ai-coding-guide` 用户引导 Skill 目录。

### 17.4 用户引导 Skill 验收

- 能读取 `.ai-index` 和 `.ai-context`。
- 能识别 MVP 支持的 4 类任务。
- 能基于 plan-do 原则生成任务计划。
- 能检查缺失字段并要求用户确认。
- 能生成适配 Qwen2.5-Coder-32B 的短上下文、强约束提示词。
- 生成提示词包含小模型约束。
- 能在代码生成后识别变更文件。
- 能执行或指导执行变更文件 ESLint。
- 能根据 ESLint 结果生成回修提示。

## 18. 后续版本规划

### 18.1 V1.0 单系统 MVP

完成治理 Agent、MVP Skill、上下文资料包生成、用户 AI Coding 引导 Skill 生成。

### 18.2 V1.1 增强上下文治理

增强页面-操作-接口映射、权限规则识别、字典规则识别、模板抽取准确度。

### 18.3 V1.2 多系统推广

支持多个系统批量治理，生成系统接入成熟度报告。

### 18.4 V2.0 AI Coding 闭环增强

在用户引导 Skill 或独立 Agent 中接入代码生成、ESLint 回检、模型回修、报告输出的完整闭环。该能力不属于 V1.0 治理 Agent 范围。

### 18.5 V2.1 案例沉淀与评测集

沉淀优秀生成案例，构建任务样例库和自动评测集，为后续模型调优和提示词优化提供依据。

## 19. 成功指标

### 19.1 接入效率指标

- 单个旧系统完成基础上下文治理的时间。
- 文档自动生成覆盖率。
- 人工确认和修正耗时。
- 首次接入 Qwen2.5-Coder-32B 的准备时间。

### 19.2 上下文质量指标

- 页面清单覆盖率。
- 组件清单覆盖率。
- 接口清单覆盖率。
- 模板示例可复用率。
- 待确认事项准确率。

### 19.3 模型生成质量指标

以下指标在用户使用引导 Skill 后统计：

- 生成代码一次通过 ESLint 的比例。
- 生成代码中不存在组件幻觉的比例。
- 生成代码中不存在接口幻觉的比例。
- 生成代码需要人工大幅调整的比例。
- 生成 patch 修改范围符合预期的比例。

### 19.4 使用体验指标

- 开发人员是否能不学习复杂 Prompt 直接使用。
- 用户引导 Skill 生成的 plan 是否清晰。
- 用户引导 Skill 生成的 Qwen 任务提示词是否完整。
- 使用指导文档是否能支撑普通开发人员独立接入。

## 20. 最终交付物

MVP 最终交付物包括：

- 存量前端系统 AI Coding 上下文治理 Agent。
- `project-detect-skill`。
- `source-inventory-skill`。
- `example-template-skill`。
- `context-doc-generate-skill`。
- `user-ai-coding-skill-generate-skill`。
- 中文上下文资料包生成能力。
- 可复制用户 AI Coding 引导 Skill 生成能力。
- 需求说明书。
- 使用说明和示例资料。

## 21. 汇报口径

本项目拟建设一套面向 Qwen2.5-Coder-32B 的存量前端系统 AI Coding 上下文治理 Agent。该 Agent 通过中等粒度 Skill 编排，对源码 zip 或本地项目目录进行扫描分析，自动生成页面清单、组件清单、接口清单、代码模板、AI 编码规则、模型检索索引和 Qwen 上下文策略。

项目的核心价值不是让模型直接替代开发，而是通过上下文治理和用户引导 Skill，将存量系统中的关键工程知识转化为模型可使用的上下文资产。用户后续将上下文资料复制到自己的工程目录，通过生成的用户 AI Coding 引导 Skill，按 plan-do 原则调用 Qwen2.5-Coder-32B 进行受控代码生成，并对变更文件执行 ESLint 轻量回检。

