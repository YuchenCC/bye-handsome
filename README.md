# bye-handsome

存量前端系统 AI Coding 上下文治理 Agent 项目。

本项目目标是为旧前端工程生成适配 AI Coding 的上下文资料包。治理 Agent 接收单个源码 zip 或本地项目目录，识别项目技术栈和工程结构，调用对应 Skill 生成中文上下文文档、机器检索索引、Qwen2.5-Coder-32B 上下文策略，以及可复制到目标工程使用的用户 AI Coding 引导 Skill。

## 项目定位

治理 Agent 只负责上下文治理，不直接调用 Qwen2.5-Coder-32B 生成业务代码，也不修改用户业务工程。生成完成后，用户将上下文资料包复制到自己的工程目录，再通过用户 AI Coding 引导 Skill 配合 Qwen2.5-Coder-32B 进行受控代码生成。

## MVP 范围

支持输入：

- 单个前端项目源码 zip
- 单个本地前端项目目录

支持项目类型：

- Vue2 / Vue3
- React
- Umi
- Webpack / Vite / Vue CLI
- JS / TS 混合项目

特殊规则：

- 当项目依赖中解析出 `jupui` 时，按 Vue2 技术栈处理。

## 预期输出

治理 Agent 输出独立上下文资料包：

```text
ai-context-package/
  docs/ai/
  .ai-index/
  .ai-context/
  .ai-skill/ai-coding-guide/
```

其中：

- `docs/ai/`：中文人读上下文文档。
- `.ai-index/`：用户引导 Skill 检索和拼接上下文用的 JSON 索引。
- `.ai-context/`：Qwen2.5-Coder-32B 的固定规则、输出格式、plan-do 策略和小模型约束。
- `.ai-skill/ai-coding-guide/`：可复制到目标工程使用的用户 AI Coding 引导 Skill。

## Skill 架构

采用治理 Agent 中心化编排 + 中等粒度 Skill：

- `project-detect-skill`：识别技术栈、依赖、构建工具、目录、命令和规范。
- `source-inventory-skill`：扫描页面、路由、组件、接口等基础清单。
- `example-template-skill`：抽取典型页面、组件、service、权限、字典等示例和模板。
- `context-doc-generate-skill`：生成 `docs/ai`、`.ai-index`、`.ai-context`。
- `user-ai-coding-skill-generate-skill`：生成用户 AI Coding 引导 Skill。

## 当前文档

- [需求说明书](docs/superpowers/specs/2026-06-06-ai-context-governance-agent-requirements.md)
- [PRD 初稿](prd/Qwen2.5-Coder-32B%20AI%20Coding%20上下文治理%20PRD.pdf)

## 开发说明

当前仓库已安装 OpenSpec 依赖：

```bash
npm install
```

如需运行本地 OpenSpec 命令，可使用：

```bash
npx openspec --help
```

