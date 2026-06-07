## 1. Regression Tests First

- [x] 1.1 Add tests that fail when `.evidence/snippets.json` contains selected candidate files with empty `content`.
- [x] 1.2 Add tests for required unresolved items: missing request wrapper, API method/path gaps, component props gaps, and permission/dictionary ambiguity.
- [x] 1.3 Add tests for inventory enrichment of common route path, API method/path, component props, and page-to-API reference patterns.
- [x] 1.4 Add tests for JSON artifact schema rejection before write.
- [x] 1.5 Add tests for model Markdown validation failure being recorded in unresolved items or governance report without writing invalid model output.
- [x] 1.6 Add tests that fallback-generated artifacts are summarized in the governance report.
- [x] 1.7 Add tests that `.ai-context` and generated Skill constraints consistently require plan-do confirmation and scoped patch/code output.

## 2. Inventory and Unresolved Items

- [x] 2.1 Extend project profile detection for package manager, source directories, state management, fetch/request signals, CSS modules, and UnoCSS where deterministically detectable.
- [x] 2.2 Add conservative route extraction for common Vue Router, React Router, and Umi route config patterns.
- [x] 2.3 Add conservative API method/path extraction for common axios/request/fetch service definitions.
- [x] 2.4 Add conservative component props extraction for Vue Options API, Vue `defineProps`, and React TypeScript props patterns.
- [x] 2.5 Add request wrapper detection gaps as structured unresolved items when wrappers are absent or ambiguous.
- [x] 2.6 Add permission, dictionary, and business-field ambiguity detection as unresolved categories without inventing values.
- [x] 2.7 Add confidence and evidence fields for page-to-API relation inference.

## 3. Evidence Package

- [x] 3.1 Change evidence package construction to read selected candidate file content asynchronously.
- [x] 3.2 Implement deterministic snippet priority and ordering across request wrappers, routes, APIs, pages, components, templates, and examples.
- [x] 3.3 Enforce per-file line limits, per-file byte limits, total byte limits, and max file count.
- [x] 3.4 Record `truncated` accurately for snippets that exceed any limit.
- [x] 3.5 Preserve candidate paths without including full source content for files outside snippet limits.
- [x] 3.6 Update evidence package tests and fixtures to verify stable snippet selection and bounded content.

## 4. Validation and Generation Status

- [x] 4.1 Define Zod schemas for project profile, inventory indexes, evidence package files, rules, templates, examples, and generation status.
- [x] 4.2 Validate known `.evidence` and `.ai-index` JSON artifacts before writing.
- [x] 4.3 Add generation status tracking for model-assisted artifacts: `model`, `fallback`, and `failed`.
- [x] 4.4 Route model Markdown validation failures into structured unresolved items with artifact, skill name, and reason.
- [x] 4.5 Avoid writing invalid model outputs while preserving valid deterministic artifacts.
- [x] 4.6 Add governance report sections for fallback-generated artifacts and failed model-generated artifacts.

## 5. Policy and Skill Alignment

- [x] 5.1 Centralize small-model constraints used by `docs/ai`, `.ai-context`, `.ai-index/rules.json`, and `.ai-skill/ai-coding-guide`.
- [x] 5.2 Update `qwen32b-output-format.md` generation to require plan first, user confirmation before execution prompts, scoped expected changed files, TODO markers, and no unrelated edits.
- [x] 5.3 Update generated AI Coding Guide Skill to assemble Qwen prompts from minimal relevant context only.
- [x] 5.4 Ensure constraints cover imports, dependencies, components, APIs, request wrapper bypasses, permissions, dictionaries, business fields, API contracts, unrelated edits, and broad refactors.
- [x] 5.5 Update docs and report wording so fallback outputs are not presented as model-generated analysis.

## 6. Verification

- [x] 6.1 Run `npm test` and confirm all tests pass.
- [x] 6.2 Run `npm run build` and confirm TypeScript compilation passes.
- [x] 6.3 Run `node_modules/.bin/openspec.cmd validate close-spec-gaps` or the equivalent local OpenSpec validation command.
- [x] 6.4 Run a sample package generation against at least one fixture and inspect `.evidence`, `.ai-index`, `.ai-context`, `.ai-skill`, and governance report outputs.
- [x] 6.5 Re-run the implementation/spec gap checklist from this change and mark only verified tasks complete.
