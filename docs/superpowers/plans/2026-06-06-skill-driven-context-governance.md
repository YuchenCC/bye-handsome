---
change: skill-driven-context-governance-prd
design-doc: docs/superpowers/specs/2026-06-06-skill-driven-context-governance-design.md
base-ref: e2aae2653445f174f107c13d12e2b34ca9e3991f
---

# Skill-Driven Context Governance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the governance Agent from template-first static generation into a Skill-driven context governance pipeline with evidence packages, model-assisted generation, validated outputs, and a stronger generated AI Coding guide Skill.

**Architecture:** Keep the existing CLI, input handling, scanners, model client, and package writer. Add a stable evidence layer and governance Skill registry, then route context document, Qwen policy, governance report, and generated Skill output through a model-assisted generator with deterministic fallback and validation.

**Tech Stack:** TypeScript, Node.js, Commander, fast-glob, adm-zip, Zod, Vitest, native `fetch`.

---

## File Structure

- Create `src/skills/registry.ts`: governance Skill metadata contract, default registry entries, JSON/Markdown rendering helpers.
- Create `src/evidence/evidencePackage.ts`: evidence package types, snippet limits, unresolved item normalization, evidence builder.
- Create `src/model/outputValidation.ts`: Markdown validation helpers for required headings, fallback markers, and forbidden business patch content.
- Modify `src/agent/input.ts`: resolve zip archives with a single top-level project directory.
- Modify `src/agent/governanceAgent.ts`: create model client, build evidence package, pass evidence/model context to generation Skills.
- Modify `src/skills/contextDocGenerate.ts`: write `.evidence`, `governance-skills`, corrected `.ai-context` names, model-assisted docs/policies/reports, fallback labels.
- Modify `src/skills/userSkillGenerate.ts`: generate workflow-oriented AI Coding guide Skill content.
- Modify `src/agent/types.ts`: add evidence, registry, generation, and unresolved item types as needed.
- Modify `src/generators/templates.ts`: add fallback labels, corrected Qwen filenames/content, examples/templates human docs, generated Skill sections if kept here.
- Modify tests under `tests/`: add focused tests for registry, evidence, validation, zip root resolution, model-assisted output, package layout, and generated Skill content.
- Modify `README.md`: document Skill-driven governance, model-assisted mode, deterministic fallback, and output layout.
- Modify `openspec/changes/skill-driven-context-governance-prd/tasks.md`: mark tasks complete as implementation lands.

## Task 1: Governance Skill Registry

**Files:**
- Create: `src/skills/registry.ts`
- Modify: `src/skills/contextDocGenerate.ts`
- Test: `tests/governanceSkillRegistry.test.ts`
- Update: `openspec/changes/skill-driven-context-governance-prd/tasks.md`

- [x] **Step 1: Write failing registry tests**

Create `tests/governanceSkillRegistry.test.ts` with assertions for required Skill names, metadata fields, JSON output, Markdown output, and forbidden business patch/source modification actions.

Run:

```bash
npx vitest run tests/governanceSkillRegistry.test.ts
```

Expected: FAIL because `src/skills/registry.ts` does not exist.

- [x] **Step 2: Implement registry types and default entries**

Create `src/skills/registry.ts` with a `GovernanceSkillDefinition` interface, `createGovernanceSkillRegistry()`, `renderSkillRegistryMarkdown()`, and `writeGovernanceSkillRegistry(outputPath)`.

Required names:

```ts
[
  "project-detect-skill",
  "source-inventory-skill",
  "example-template-skill",
  "context-doc-generate-skill",
  "qwen-context-policy-generate-skill",
  "governance-report-generate-skill",
  "user-ai-coding-skill-generate-skill"
]
```

Each model-capable Skill must include forbidden actions for `business source-code patch generation` and `scanned project source modification`.

- [x] **Step 3: Write registry into the package**

Update `contextDocGenerateSkill` to write:

```text
governance-skills/skill-registry.json
governance-skills/SKILL_REGISTRY.md
```

Use existing `writePackageJson` and `writePackageFile`.

- [x] **Step 4: Verify and commit**

Run:

```bash
npx vitest run tests/governanceSkillRegistry.test.ts
npm test
```

Expected: PASS.

Commit:

```bash
git add src/skills/registry.ts src/skills/contextDocGenerate.ts tests/governanceSkillRegistry.test.ts openspec/changes/skill-driven-context-governance-prd/tasks.md
git commit -m "Add governance skill registry"
```

## Task 2: Evidence Package

**Files:**
- Create: `src/evidence/evidencePackage.ts`
- Modify: `src/agent/types.ts`
- Modify: `src/agent/governanceAgent.ts`
- Modify: `src/skills/contextDocGenerate.ts`
- Test: `tests/evidencePackage.test.ts`
- Update: `openspec/changes/skill-driven-context-governance-prd/tasks.md`

- [x] **Step 1: Write failing evidence tests**

Create tests that build evidence from the existing fixture projects and verify:

- project profile is present.
- candidate pages/components/APIs/routes/request wrappers are present.
- snippets are bounded.
- unresolved items include missing route/API/props/template uncertainty where applicable.
- `.evidence` files are written in the output package.

Run:

```bash
npx vitest run tests/evidencePackage.test.ts
```

Expected: FAIL because evidence package code does not exist.

- [x] **Step 2: Implement evidence package builder**

Create `buildEvidencePackage({ profile, inventory, templates })`.

Use conservative limits:

```ts
const DEFAULT_SNIPPET_LIMITS = {
  maxFiles: 20,
  maxLinesPerFile: 80,
  maxTotalBytes: 80_000
};
```

Initial snippets may be empty or derived from candidate file metadata if full snippet extraction is deferred, but limits and schema must exist.

- [x] **Step 3: Persist evidence**

Update `contextDocGenerateSkill` to write:

```text
.evidence/project-profile.json
.evidence/file-tree.json
.evidence/candidates/pages.json
.evidence/candidates/components.json
.evidence/candidates/apis.json
.evidence/candidates/routes.json
.evidence/candidates/request-wrappers.json
.evidence/snippets.json
.evidence/unresolved-items.json
```

- [x] **Step 4: Verify and commit**

Run:

```bash
npx vitest run tests/evidencePackage.test.ts
npm test
```

Expected: PASS.

Commit:

```bash
git add src/evidence/evidencePackage.ts src/agent/types.ts src/agent/governanceAgent.ts src/skills/contextDocGenerate.ts tests/evidencePackage.test.ts openspec/changes/skill-driven-context-governance-prd/tasks.md
git commit -m "Add evidence package generation"
```

## Task 3: Output Layout and Zip Root Alignment

**Files:**
- Modify: `src/agent/input.ts`
- Modify: `src/skills/contextDocGenerate.ts`
- Modify: `src/generators/templates.ts`
- Test: `tests/input.test.ts`
- Test: `tests/contextPackage.test.ts`
- Update: `openspec/changes/skill-driven-context-governance-prd/tasks.md`

- [x] **Step 1: Write failing layout and zip tests**

Add a zip fixture test where the zip contains one top-level directory with `package.json` inside it. Assert `prepareWorkspace()` resolves `workspacePath` to that nested project root.

Update package tests to expect:

```text
.ai-context/qwen32b-output-format.md
.ai-context/qwen32b-plan-do-policy.md
.ai-context/qwen32b-quality-check.md
docs/ai/templates/
docs/ai/examples/
```

Run:

```bash
npx vitest run tests/input.test.ts tests/contextPackage.test.ts
```

Expected: FAIL on current zip root and old `.ai-context` filenames.

- [x] **Step 2: Implement zip root resolution**

In `prepareWorkspace`, after extraction:

- list top-level entries.
- if there is exactly one top-level directory and it contains `package.json`, set `workspacePath` to that directory.
- keep cleanup pointing at the extraction temp root.

- [x] **Step 3: Correct `.ai-context` filenames and docs directories**

Update `contextDocGenerateSkill` to write:

```text
.ai-context/qwen32b-output-format.md
.ai-context/qwen32b-plan-do-policy.md
.ai-context/qwen32b-quality-check.md
docs/ai/templates/README.md
docs/ai/examples/README.md
```

Remove writes to old `.ai-context/output-format.md`, `.ai-context/plan-do-policy.md`, and `.ai-context/quality-check-policy.md`.

- [x] **Step 4: Verify and commit**

Run:

```bash
npx vitest run tests/input.test.ts tests/contextPackage.test.ts
npm test
```

Expected: PASS.

Commit:

```bash
git add src/agent/input.ts src/skills/contextDocGenerate.ts src/generators/templates.ts tests/input.test.ts tests/contextPackage.test.ts openspec/changes/skill-driven-context-governance-prd/tasks.md
git commit -m "Align context package output layout"
```

## Task 4: Model-Assisted Generation and Validation

**Files:**
- Create: `src/model/outputValidation.ts`
- Modify: `src/model/modelClient.ts`
- Modify: `src/agent/governanceAgent.ts`
- Modify: `src/skills/contextDocGenerate.ts`
- Modify: `src/skills/userSkillGenerate.ts`
- Test: `tests/modelAssistedGeneration.test.ts`
- Test: `tests/modelClient.test.ts`
- Update: `openspec/changes/skill-driven-context-governance-prd/tasks.md`

- [x] **Step 1: Write failing model-assisted tests**

Add tests covering:

- configured model mock generates a documentation artifact.
- no model configured writes deterministic fallback marker.
- Markdown without required headings is rejected.
- Markdown containing business patch language is rejected.
- model requests use evidence-shaped input rather than raw source text.

Run:

```bash
npx vitest run tests/modelAssistedGeneration.test.ts
```

Expected: FAIL.

- [x] **Step 2: Implement Markdown validation**

Create validators:

- `validateMarkdownSections(text, requiredHeadings)`
- `assertNoBusinessPatchContent(text)`
- `assertFallbackMarker(text)` for fallback mode

Forbidden content checks should catch source patch intent such as `diff --git`, `apply this patch`, and direct scanned-project source modification language.

- [x] **Step 3: Wire model client into generation path**

Update `runGovernanceAgent` to create `const modelClient = createModelClient(options.model)` and pass it into generation Skills.

Update generation Skills so configured model calls are attempted only for approved governance purposes:

- documentation
- context-policy
- user-skill

When `NoopModelClient` throws no-model errors, fall back deterministically with explicit fallback markers.

- [x] **Step 4: Verify and commit**

Run:

```bash
npx vitest run tests/modelAssistedGeneration.test.ts tests/modelClient.test.ts
npm test
```

Expected: PASS.

Commit:

```bash
git add src/model/outputValidation.ts src/model/modelClient.ts src/agent/governanceAgent.ts src/skills/contextDocGenerate.ts src/skills/userSkillGenerate.ts tests/modelAssistedGeneration.test.ts tests/modelClient.test.ts openspec/changes/skill-driven-context-governance-prd/tasks.md
git commit -m "Add model-assisted context generation"
```

## Task 5: Generated AI Coding Guide Skill

**Files:**
- Modify: `src/skills/userSkillGenerate.ts`
- Modify: `src/generators/templates.ts` if Skill templates live there after Task 4
- Test: `tests/userSkillGenerate.test.ts`
- Update: `openspec/changes/skill-driven-context-governance-prd/tasks.md`

- [ ] **Step 1: Write failing generated Skill tests**

Update tests to assert `SKILL.md` includes:

- task classification.
- context retrieval from `.ai-index`, `.ai-context`, and `docs/ai`.
- missing information confirmation for page, route, API, component, business fields, permissions, and dictionaries.
- Qwen prompt assembly format.
- small-model constraints covering invented permissions, dictionaries, business fields, and guessed API input/output contracts.
- changed-file detection and ESLint repair prompt guidance.

Run:

```bash
npx vitest run tests/userSkillGenerate.test.ts
```

Expected: FAIL on missing sections.

- [ ] **Step 2: Rewrite generated Skill content**

Make `renderSkill(profile)` produce a workflow-oriented Skill with concrete sections:

- Required context.
- Supported task types.
- Request parsing.
- Context retrieval.
- Missing confirmation.
- Plan-do gate.
- Qwen prompt format.
- Small-model constraints.
- Changed-file ESLint flow.
- Repair prompt flow.

- [ ] **Step 3: Verify and commit**

Run:

```bash
npx vitest run tests/userSkillGenerate.test.ts
npm test
```

Expected: PASS.

Commit:

```bash
git add src/skills/userSkillGenerate.ts src/generators/templates.ts tests/userSkillGenerate.test.ts openspec/changes/skill-driven-context-governance-prd/tasks.md
git commit -m "Strengthen generated AI coding guide skill"
```

## Task 6: Documentation, Full Verification, and Push

**Files:**
- Modify: `README.md`
- Modify: `src/generators/templates.ts`
- Modify: `openspec/changes/skill-driven-context-governance-prd/tasks.md`

- [ ] **Step 1: Update docs**

Update README and generated Agent usage documentation to explain:

- Skill-driven governance model.
- Evidence collection.
- Governance Skill registry.
- Model-assisted generation.
- Deterministic fallback behavior.
- Target-project AI Coding usage.

- [ ] **Step 2: Mark OpenSpec tasks complete**

Update `openspec/changes/skill-driven-context-governance-prd/tasks.md` so completed implementation tasks are checked.

- [ ] **Step 3: Run full verification**

Run:

```bash
npm test
npm run lint
npm run build
```

Expected: all commands PASS.

- [ ] **Step 4: Commit and push**

Commit:

```bash
git add README.md src/generators/templates.ts openspec/changes/skill-driven-context-governance-prd/tasks.md
git commit -m "Document skill-driven governance workflow"
git push
```

## Self-Review

- Spec coverage: the plan covers all four capabilities: governance registry, evidence package, model-assisted generation, and generated AI Coding guide Skill.
- Output coverage: corrected `.ai-context` names, `docs/ai/templates`, `docs/ai/examples`, `.evidence`, and `governance-skills` are covered.
- Model boundary coverage: configured model, fallback, validation, and business patch blocking are covered.
- Recovery coverage: each task ends with tests and a commit, matching Comet build recovery expectations.
