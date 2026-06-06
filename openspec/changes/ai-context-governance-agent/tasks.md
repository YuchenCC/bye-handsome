## 1. Project Setup

- [x] 1.1 Define the implementation module structure for the governance Agent, Skills, scanners, generators, templates, and test fixtures.
- [x] 1.2 Add or confirm required runtime and development dependencies for CLI execution, zip handling, filesystem traversal, JSON output, and tests.
- [x] 1.3 Add sample frontend fixture projects or fixture directories for Vue2, Vue3, React, Umi, and `jupui` detection.

## 2. Governance Agent

- [x] 2.1 Implement input handling for a single source zip and a single local project directory.
- [x] 2.2 Implement temporary workspace handling for zip extraction without modifying scanned source files.
- [x] 2.3 Implement Agent workflow orchestration from project detection through final context package generation.
- [x] 2.4 Implement governance report aggregation for scan results, missing items, errors, and manual confirmation items.
- [x] 2.5 Add governance Agent usage documentation covering prerequisites, inputs, run flow, outputs, copy workflow, and troubleshooting.
- [x] 2.6 Implement a unified model invocation layer that supports configured API models and current-session model mode.
- [x] 2.7 Enforce the boundary that model calls may generate governance documentation and Skills but must not generate business code patches.

## 3. Context Generation Skills

- [x] 3.1 Implement `project-detect-skill` with stack, dependency, command, directory, build tool, UI framework, request layer, route style, style system, and quality config detection.
- [x] 3.2 Implement the `jupui` dependency rule so matching projects are classified as Vue2.
- [x] 3.3 Implement `source-inventory-skill` for page, route, component, API, request wrapper, and basic page-to-API inventory generation.
- [x] 3.4 Implement internal stack-specific scanner selection for Vue2, Vue3, React, and Umi without exposing each scanner as a separate external Skill.
- [x] 3.5 Implement `example-template-skill` for extracting representative page, component, service, route, permission, and dictionary examples.

## 4. Context Package Output

- [x] 4.1 Implement `context-doc-generate-skill` output for Chinese `docs/ai` documents.
- [x] 4.2 Implement `.ai-index` JSON generation for project profile, pages, components, APIs, routes, templates, examples, and rules.
- [x] 4.3 Implement `.ai-context` generation for Qwen32B system prompt, context policy, output format, plan-do policy, and quality check policy.
- [x] 4.4 Ensure the final output is an independent `ai-context-package` directory and does not write generated files into the scanned project source.
- [x] 4.5 Ensure generated output documentation clearly separates Agent usage from target-project AI Coding usage.
- [x] 4.6 Validate model-generated JSON or Markdown artifacts against schemas or fixed templates before writing them.

## 5. User AI Coding Guide Skill

- [x] 5.1 Implement `user-ai-coding-skill-generate-skill` to create `.ai-skill/ai-coding-guide/SKILL.md`, templates, checks, and usage instructions.
- [x] 5.2 Encode the plan-do workflow for user request parsing, missing field confirmation, context retrieval, plan confirmation, Qwen prompt generation, and post-generation checks.
- [x] 5.3 Encode small-model constraints forbidding invented imports, dependencies, components, APIs, request wrapper bypasses, unconfirmed fields, unrelated edits, and unrequested large refactors.
- [x] 5.4 Add changed-file ESLint guidance or execution flow for `.js`, `.jsx`, `.ts`, `.tsx`, and `.vue` files.
- [x] 5.5 Add ESLint error summarization and constrained repair prompt generation.

## 6. Verification

- [x] 6.1 Add tests for zip input and local directory input.
- [x] 6.2 Add tests for project detection, including `jupui` to Vue2 classification.
- [x] 6.3 Add tests for inventory and template extraction against fixture projects.
- [x] 6.4 Add tests or snapshots for `docs/ai`, `.ai-index`, `.ai-context`, and `.ai-skill/ai-coding-guide` output.
- [x] 6.5 Add tests for configured model invocation, current-session model mode fallback, output validation, and business patch blocking.
- [x] 6.6 Run OpenSpec validation for `ai-context-governance-agent`.
- [x] 6.7 Run the project test suite and document any remaining manual verification gaps.
