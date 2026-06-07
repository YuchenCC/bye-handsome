# Comet Design Handoff

- Change: close-spec-gaps
- Phase: design
- Mode: compact
- Context hash: 1a2a4c736bd19d25af3fb85ffb1635d257b0f3323bb7f8f3794925111f7a912a

Generated-by: comet-handoff.sh

OpenSpec remains the canonical capability spec. This handoff is a deterministic, source-traceable context pack, not an agent-authored summary.

## openspec/changes/close-spec-gaps/proposal.md

- Source: openspec/changes/close-spec-gaps/proposal.md
- Lines: 1-34
- SHA256: 65b33057aba33050c0cbb5b2558cacebe1a6131cf9f43e231cec06f3355c517c

```md
## Why

The current implementation produces the expected MVP package shape, but code review found several places where the implementation is shallower than the active specs and design documents describe. This change closes those gaps so completed tasks are backed by verifiable behavior rather than directory scaffolding or placeholder fields.

## What Changes

- Strengthen project and source inventory extraction so generated indexes carry useful route, API, component, request wrapper, permission, dictionary, and relationship facts where they can be determined.
- Persist explicit unresolved items when required details cannot be reliably extracted, including request wrapper absence, API method/path gaps, component props gaps, and permission/dictionary ambiguity.
- Populate `.evidence/snippets.json` with bounded source snippets instead of empty placeholder content.
- Apply schema validation to generated JSON/index artifacts and make model Markdown validation failures produce recorded failures instead of silent invalid writes or unreported aborts.
- Report deterministic fallback and model-generation failure status in governance outputs.
- Align `.ai-context` and generated AI Coding Guide wording so Qwen patch/code output remains gated by plan-do confirmation and scoped task constraints.
- Add focused tests that prove each spec gap is closed.

## Capabilities

### New Capabilities

- `scanner-semantic-inventory`: Defines stronger inventory extraction and unresolved-item requirements for project profile, pages, routes, components, APIs, request wrappers, permissions, dictionaries, and basic relations.
- `bounded-evidence-snippets`: Defines how evidence snippets are selected, truncated, bounded, and written with actual content for downstream model-assisted generation.
- `generation-validation-and-failure-reporting`: Defines JSON/Markdown validation behavior, model failure handling, fallback status reporting, and governance-report visibility.
- `qwen-policy-scope-alignment`: Defines wording and output constraints that keep generated Qwen prompts and policies within plan-do, task scope, and user-confirmed execution boundaries.

### Modified Capabilities

- None. The repository has no archived main specs yet; this change adds focused delta specs for the next implementation pass.

## Impact

- Affects `src/scanners`, `src/evidence`, `src/model`, `src/skills`, and `src/generators`.
- Adds or updates tests around project detection, source inventory, evidence package generation, model-assisted generation, context package output, and generated user Skill contents.
- Does not add business code generation to the governance Agent.
- Does not modify scanned project source code.
- Does not expand the MVP beyond a single input project.
```

## openspec/changes/close-spec-gaps/design.md

- Source: openspec/changes/close-spec-gaps/design.md
- Lines: 1-95
- SHA256: 0bda679b5a6ee21c2a1ec6f8453e1397912b96c05c714e8ebe37df8512ac1a2c

[TRUNCATED]

```md
## Context

The current codebase can generate the expected package layout and passes the existing test suite, but the review against `docs/superpowers/specs` found that several requirements are implemented only as placeholders or broad templates:

- Inventory extraction is mostly path-based.
- Component props, API methods/paths, route paths, permissions, dictionaries, and request-wrapper gaps are not consistently resolved or reported.
- Evidence snippets define limits but store empty content.
- JSON schema validation exists but is not wired into most package writes.
- Model validation failures abort or throw without being reflected in unresolved items or governance reports.
- Fallback markers appear in individual fallback artifacts, but fallback status is not summarized in governance outputs.
- Qwen output policy wording can be read as allowing patch/code output without clearly tying that to plan-do confirmation.

This change is a remediation pass. It does not redefine the product. It converts existing spec intent into verifiable behavior.

## Goals / Non-Goals

**Goals:**

- Make source inventories useful enough for downstream prompt assembly while staying deterministic.
- Populate bounded evidence snippets with actual content and truncation metadata.
- Route validation and generation failure information into `.evidence/unresolved-items.json` and governance reports.
- Add schema validation for JSON package artifacts at the writer boundary or immediately before writes.
- Make fallback/model-generation status auditable.
- Align Qwen policy and generated Skill constraints with plan-do and task scope.
- Add focused tests that fail on the current placeholder behavior.

**Non-Goals:**

- No full AST-grade semantic understanding for every framework pattern.
- No business code generation inside the governance Agent.
- No modification of scanned project source code.
- No monorepo, Next.js, Nuxt, Angular, mini-program, or multi-project expansion.
- No mandatory full build, full typecheck, or target-project ESLint execution in the governance phase.

## Decisions

### Decision 1: Keep scanners deterministic and conservative

Use lightweight deterministic extraction before considering deeper parsing. For JS/TS files, prefer TypeScript compiler or simple AST parsing if already practical in the dependency set; otherwise use bounded text extraction with clear confidence labels. For Vue files, parse enough SFC text to identify common props declarations and imports without claiming certainty when patterns are complex.

Alternative considered: model-assisted extraction from snippets. Rejected for this pass because inventory indexes are the fact layer and should remain deterministic.

### Decision 2: Treat unresolved items as first-class output

Introduce a structured unresolved item shape that can include source, category, file path, message, and severity. Existing plain messages can be preserved for compatibility, but new code should emit category-specific items so reports can group them.

Alternative considered: keep unresolved items as strings only. Rejected because failure reporting and scan gaps need stable categories for tests and governance reports.

### Decision 3: Build snippets asynchronously from candidate paths

Change evidence package generation so snippet content is read from selected candidate files under explicit limits. Selection should remain stable by sorted candidate paths and priority classes: request wrappers, routes, APIs, pages, components, templates/examples.

Alternative considered: include snippets for every candidate. Rejected because the specs explicitly forbid full source injection and require bounded evidence.

### Decision 4: Validate package artifacts close to write time

Keep `writePackageJson` as a low-level writer, but add typed generation helpers or pre-write validation in the skills that produce known JSON artifacts. This avoids making the generic writer responsible for every schema while still preventing invalid known artifacts.

Alternative considered: validate only model JSON. Rejected because `.ai-index` and `.evidence` are contract artifacts even when deterministic.

### Decision 5: Represent generation status explicitly

Track generation status for model-assisted artifacts: `model`, `fallback`, or `failed`. Feed this status into governance report rendering and `.evidence/unresolved-items.json`. Invalid model output should not be written as the target artifact.

Alternative considered: continue throwing on invalid model output. Rejected because users need a package-level report that explains partial generation status.

### Decision 6: Align policy text through shared constraints

Centralize the small-model constraints used by `docs/ai`, `.ai-context`, `.ai-index/rules.json`, and the generated Skill. This reduces drift and makes tests straightforward.

Alternative considered: keep duplicated strings. Rejected because the current drift is one of the reviewed gaps.

## Risks / Trade-offs

- Static extraction can overstate confidence -> include confidence/evidence fields and unresolved items for uncertain data.
- Snippet content can leak too much source -> enforce file, line, byte, and total byte limits with tests.
- Schema validation can make generation stricter and expose existing fixture gaps -> update fixtures intentionally rather than weakening schemas.
- Partial failure handling can complicate current Promise-based writes -> compute validated artifacts and statuses before parallel writes.
- More detailed reports may be noisy -> group unresolved items by category and source.

```

Full source: openspec/changes/close-spec-gaps/design.md

## openspec/changes/close-spec-gaps/tasks.md

- Source: openspec/changes/close-spec-gaps/tasks.md
- Lines: 1-53
- SHA256: b68890b53180f347150f330e13f459f667d8fec4bb8dbfd54622efc81db309c8

```md
## 1. Regression Tests First

- [ ] 1.1 Add tests that fail when `.evidence/snippets.json` contains selected candidate files with empty `content`.
- [ ] 1.2 Add tests for required unresolved items: missing request wrapper, API method/path gaps, component props gaps, and permission/dictionary ambiguity.
- [ ] 1.3 Add tests for inventory enrichment of common route path, API method/path, component props, and page-to-API reference patterns.
- [ ] 1.4 Add tests for JSON artifact schema rejection before write.
- [ ] 1.5 Add tests for model Markdown validation failure being recorded in unresolved items or governance report without writing invalid model output.
- [ ] 1.6 Add tests that fallback-generated artifacts are summarized in the governance report.
- [ ] 1.7 Add tests that `.ai-context` and generated Skill constraints consistently require plan-do confirmation and scoped patch/code output.

## 2. Inventory and Unresolved Items

- [ ] 2.1 Extend project profile detection for package manager, source directories, state management, fetch/request signals, CSS modules, and UnoCSS where deterministically detectable.
- [ ] 2.2 Add conservative route extraction for common Vue Router, React Router, and Umi route config patterns.
- [ ] 2.3 Add conservative API method/path extraction for common axios/request/fetch service definitions.
- [ ] 2.4 Add conservative component props extraction for Vue Options API, Vue `defineProps`, and React TypeScript props patterns.
- [ ] 2.5 Add request wrapper detection gaps as structured unresolved items when wrappers are absent or ambiguous.
- [ ] 2.6 Add permission, dictionary, and business-field ambiguity detection as unresolved categories without inventing values.
- [ ] 2.7 Add confidence and evidence fields for page-to-API relation inference.

## 3. Evidence Package

- [ ] 3.1 Change evidence package construction to read selected candidate file content asynchronously.
- [ ] 3.2 Implement deterministic snippet priority and ordering across request wrappers, routes, APIs, pages, components, templates, and examples.
- [ ] 3.3 Enforce per-file line limits, per-file byte limits, total byte limits, and max file count.
- [ ] 3.4 Record `truncated` accurately for snippets that exceed any limit.
- [ ] 3.5 Preserve candidate paths without including full source content for files outside snippet limits.
- [ ] 3.6 Update evidence package tests and fixtures to verify stable snippet selection and bounded content.

## 4. Validation and Generation Status

- [ ] 4.1 Define Zod schemas for project profile, inventory indexes, evidence package files, rules, templates, examples, and generation status.
- [ ] 4.2 Validate known `.evidence` and `.ai-index` JSON artifacts before writing.
- [ ] 4.3 Add generation status tracking for model-assisted artifacts: `model`, `fallback`, and `failed`.
- [ ] 4.4 Route model Markdown validation failures into structured unresolved items with artifact, skill name, and reason.
- [ ] 4.5 Avoid writing invalid model outputs while preserving valid deterministic artifacts.
- [ ] 4.6 Add governance report sections for fallback-generated artifacts and failed model-generated artifacts.

## 5. Policy and Skill Alignment

- [ ] 5.1 Centralize small-model constraints used by `docs/ai`, `.ai-context`, `.ai-index/rules.json`, and `.ai-skill/ai-coding-guide`.
- [ ] 5.2 Update `qwen32b-output-format.md` generation to require plan first, user confirmation before execution prompts, scoped expected changed files, TODO markers, and no unrelated edits.
- [ ] 5.3 Update generated AI Coding Guide Skill to assemble Qwen prompts from minimal relevant context only.
- [ ] 5.4 Ensure constraints cover imports, dependencies, components, APIs, request wrapper bypasses, permissions, dictionaries, business fields, API contracts, unrelated edits, and broad refactors.
- [ ] 5.5 Update docs and report wording so fallback outputs are not presented as model-generated analysis.

## 6. Verification

- [ ] 6.1 Run `npm test` and confirm all tests pass.
- [ ] 6.2 Run `npm run build` and confirm TypeScript compilation passes.
- [ ] 6.3 Run `node_modules/.bin/openspec.cmd validate close-spec-gaps` or the equivalent local OpenSpec validation command.
- [ ] 6.4 Run a sample package generation against at least one fixture and inspect `.evidence`, `.ai-index`, `.ai-context`, `.ai-skill`, and governance report outputs.
- [ ] 6.5 Re-run the implementation/spec gap checklist from this change and mark only verified tasks complete.
```

## openspec/changes/close-spec-gaps/specs/bounded-evidence-snippets/spec.md

- Source: openspec/changes/close-spec-gaps/specs/bounded-evidence-snippets/spec.md
- Lines: 1-29
- SHA256: 414ce4dedaad72e5531116b9b1cfc4489435b884a530bd0584956a53a9140277

```md
## ADDED Requirements

### Requirement: Evidence snippets contain bounded source content
The system SHALL write selected source snippets with actual content in `.evidence/snippets.json` while respecting configured limits.

#### Scenario: Candidate files are selected for evidence
- **WHEN** candidate page, component, API, route, request wrapper, template, or example files exist
- **THEN** `.evidence/snippets.json` SHALL include bounded content for selected files instead of empty placeholder strings

### Requirement: Snippet truncation metadata
The system SHALL record truncation metadata for each snippet and enforce global evidence limits.

#### Scenario: Candidate file exceeds snippet limits
- **WHEN** a selected file exceeds per-file line limits, per-file byte limits, or the remaining total byte budget
- **THEN** the snippet SHALL be truncated, `truncated` SHALL be true, and the recorded content SHALL stay within the configured limits

### Requirement: Deterministic snippet selection
The system SHALL select snippets deterministically so repeated runs on the same input produce stable evidence.

#### Scenario: Multiple candidate files are available
- **WHEN** the evidence package is built for the same project content more than once
- **THEN** snippet item ordering and selected file paths SHALL be stable

### Requirement: No full source injection
The system SHALL NOT include the full source tree or all candidate file contents in the evidence package.

#### Scenario: Project has more candidates than the snippet limit
- **WHEN** candidate files exceed configured snippet limits
- **THEN** the evidence package SHALL include only the selected bounded snippets and SHALL preserve the remaining files as candidate paths only
```

## openspec/changes/close-spec-gaps/specs/generation-validation-and-failure-reporting/spec.md

- Source: openspec/changes/close-spec-gaps/specs/generation-validation-and-failure-reporting/spec.md
- Lines: 1-29
- SHA256: 4e73fe2a08bf1de61649c48289c3f8c8145077a175f06dc7d4bb2526072e5521

```md
## ADDED Requirements

### Requirement: JSON artifact schema validation
The system SHALL validate generated JSON artifacts against schemas before writing them to the context package.

#### Scenario: JSON artifact does not match schema
- **WHEN** a generated JSON artifact is missing required fields or contains an invalid shape
- **THEN** the system SHALL reject the invalid artifact and record the failure instead of writing invalid JSON

### Requirement: Markdown generation failure recording
The system SHALL record model-generated Markdown validation failures in governance outputs.

#### Scenario: Model Markdown fails validation
- **WHEN** model-generated Markdown is missing required sections or contains forbidden business patch content
- **THEN** the system SHALL reject that model output and record the failed artifact, skill name, and validation reason in unresolved items or the governance report

### Requirement: Fallback status visibility
The system SHALL make deterministic fallback status visible both inside fallback artifacts and in the governance report.

#### Scenario: Model is unavailable
- **WHEN** a model-assisted artifact is produced by deterministic fallback
- **THEN** the artifact SHALL include the fallback marker and the governance report SHALL list that artifact as fallback-generated

### Requirement: Partial failure behavior
The system SHALL avoid losing all successful deterministic outputs when one model-assisted artifact fails validation.

#### Scenario: One model-assisted artifact is invalid
- **WHEN** a model-assisted artifact fails validation after configured handling
- **THEN** the system SHALL write valid deterministic artifacts, record the failed artifact status, and avoid writing the invalid model output
```

## openspec/changes/close-spec-gaps/specs/qwen-policy-scope-alignment/spec.md

- Source: openspec/changes/close-spec-gaps/specs/qwen-policy-scope-alignment/spec.md
- Lines: 1-22
- SHA256: ff9bb104123c88fb1a710e12e2ebd23b3950201a965f46519a41dfccfb6fcdd1

```md
## ADDED Requirements

### Requirement: Qwen output policy remains plan-do gated
The system SHALL word `.ai-context` output policies so patch or code output is allowed only after plan-do confirmation and within the confirmed task scope.

#### Scenario: Qwen output format is generated
- **WHEN** `.ai-context/qwen32b-output-format.md` is written
- **THEN** it SHALL require a plan first, user confirmation before execution prompts, scoped changed-file expectations, TODO markers for uncertainty, and no unrelated edits

### Requirement: Generated Skill enforces scoped prompt assembly
The generated AI Coding Guide Skill SHALL instruct the model or Agent to assemble Qwen prompts from minimal relevant context only.

#### Scenario: User requests a coding task
- **WHEN** the generated Skill prepares a Qwen prompt
- **THEN** it SHALL include only relevant `.ai-index`, `.ai-context`, `docs/ai`, templates, examples, and bounded evidence needed for the confirmed task

### Requirement: Constraint wording is consistent across artifacts
The system SHALL keep small-model constraints consistent across `docs/ai`, `.ai-context`, `.ai-index/rules.json`, and `.ai-skill/ai-coding-guide`.

#### Scenario: Context package is generated
- **WHEN** all context package artifacts are written
- **THEN** import, dependency, component, API, request wrapper, permission, dictionary, business field, API contract, unrelated edit, and large refactor constraints SHALL be represented consistently
```

## openspec/changes/close-spec-gaps/specs/scanner-semantic-inventory/spec.md

- Source: openspec/changes/close-spec-gaps/specs/scanner-semantic-inventory/spec.md
- Lines: 1-29
- SHA256: 535912b6885f1a1f24fe975d4135581ce4da17e07ebdafd3983d9d8c263a455f

```md
## ADDED Requirements

### Requirement: Semantic project profile
The system SHALL identify project profile fields required by the governance specs when the information is available from project metadata or common config files.

#### Scenario: Project metadata contains supported signals
- **WHEN** package metadata or common config files expose stack, build tool, package manager, source directories, UI framework, state management, request layer, route style, style system, or quality tooling
- **THEN** the project profile SHALL include those detected facts with traceable evidence or record a confirmation item when required facts cannot be confirmed

### Requirement: Structured source inventory details
The system SHALL enrich page, route, component, API, request wrapper, and relation inventories beyond file-only placeholders when reliable static extraction is possible.

#### Scenario: Inventory candidates contain parseable facts
- **WHEN** source files contain route paths, component props, API methods, API paths, request wrapper usage, or page-to-API references that can be extracted deterministically
- **THEN** the generated inventories SHALL include those facts instead of leaving fields empty or marked as pending confirmation

### Requirement: Required unresolved items
The system SHALL persist unresolved items for missing or ambiguous governance facts rather than silently omitting them.

#### Scenario: Scanner cannot confirm required facts
- **WHEN** the scanner cannot identify page directories, route paths, request wrappers, API methods or paths, component props, permissions, dictionaries, or business fields
- **THEN** `.evidence/unresolved-items.json` and the governance report SHALL include specific confirmation items for each missing or ambiguous category

### Requirement: Conservative relationship inference
The system SHALL label inferred relationships with confidence and evidence so downstream prompt assembly can distinguish facts from heuristics.

#### Scenario: Page-to-API relation is inferred
- **WHEN** a page-to-API relation is inferred by imports, direct references, or naming heuristics
- **THEN** the relation SHALL include the source page, target API file, confidence type, and evidence description
```

