---
change: close-spec-gaps
design-doc: docs/superpowers/specs/2026-06-07-close-spec-gaps-design.md
base-ref: cad963a7bc0e877f5915c65b39a81cc3a7789cf7
---

# Close Spec Gaps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the reviewed gaps between the implementation and the OpenSpec/docs requirements for inventory detail, bounded evidence, validation, failure reporting, and Qwen policy scope.

**Architecture:** Keep the existing CLI and Skill orchestration unchanged. Strengthen deterministic scanner helpers, introduce structured unresolved/generation status data, populate bounded evidence snippets, validate JSON artifacts before writing, and render shared constraints consistently across generated outputs.

**Tech Stack:** TypeScript, Node.js fs/promises, fast-glob, Zod, Vitest, existing OpenSpec/Comet artifacts.

---

## File Structure

- Modify `src/agent/types.ts`: add structured unresolved item, generation status, richer relation/confidence fields, and optional inventory fields.
- Modify `src/scanners/projectScanner.ts`: detect additional metadata signals conservatively.
- Modify `src/scanners/inventoryHelpers.ts`: add extractors for route/API/props/reference facts and relation evidence.
- Modify `src/scanners/vueScanner.ts` and `src/scanners/reactScanner.ts`: call richer helpers and emit unresolved items.
- Modify `src/evidence/evidencePackage.ts`: make evidence building async or add async snippet builder, enforce snippet limits, write structured unresolved items and generation status.
- Create or modify `src/model/packageSchemas.ts`: define Zod schemas for known `.evidence` and `.ai-index` JSON artifacts.
- Modify `src/generators/packageWriter.ts`: add schema-aware JSON writer helper while preserving the low-level writer.
- Modify `src/generators/templates.ts`: centralize constraints and render generation status/fallback sections.
- Modify `src/skills/contextDocGenerate.ts` and `src/skills/userSkillGenerate.ts`: track model/fallback/failed status, reject invalid outputs, and render aligned constraints.
- Add or update tests in `tests/sourceInventory.test.ts`, `tests/evidencePackage.test.ts`, `tests/contextPackage.test.ts`, `tests/modelAssistedGeneration.test.ts`, and `tests/userSkillGenerate.test.ts`.

## Task 1: Regression Tests for Current Gaps

**Files:**
- Modify: `tests/evidencePackage.test.ts`
- Modify: `tests/sourceInventory.test.ts`
- Modify: `tests/modelAssistedGeneration.test.ts`
- Modify: `tests/contextPackage.test.ts`
- Modify: `tests/userSkillGenerate.test.ts`

- [ ] **Step 1: Add evidence snippet non-empty regression**

Add a test that builds evidence from a fixture with at least one page/API candidate and asserts selected snippet content is not empty:

```ts
expect(evidence.snippets.items.length).toBeGreaterThan(0);
expect(evidence.snippets.items[0].content.trim().length).toBeGreaterThan(0);
expect(evidence.snippets.items[0].filePath).toMatch(/^src\//);
```

- [ ] **Step 2: Add unresolved item regression tests**

Add assertions that missing request wrappers, route paths, API method/path gaps, component props gaps, and permission/dictionary ambiguity produce categorized unresolved items:

```ts
expect(unresolvedItems).toEqual(
  expect.arrayContaining([
    expect.objectContaining({ category: "request-wrapper" }),
    expect.objectContaining({ category: "api-contract" }),
    expect.objectContaining({ category: "component-props" }),
    expect.objectContaining({ category: "permission" }),
    expect.objectContaining({ category: "dictionary" })
  ])
);
```

- [ ] **Step 3: Add inventory enrichment tests**

Create fixture files or extend existing fixtures with static route/API/props patterns and assert extracted values:

```ts
expect(inventory.routes).toContainEqual(
  expect.objectContaining({ routePath: "/users" })
);
expect(inventory.apis).toContainEqual(
  expect.objectContaining({ method: "get", path: "/api/users" })
);
expect(inventory.components).toContainEqual(
  expect.objectContaining({ props: expect.arrayContaining(["value", "disabled"]) })
);
```

- [ ] **Step 4: Add validation/failure reporting tests**

Use a fake model client that returns invalid Markdown and assert invalid content is not written as the target artifact while failure status is recorded:

```ts
await expect(runGeneration()).resolves.toBeUndefined();
expect(report).toContain("failed");
expect(unresolvedItems).toEqual(
  expect.arrayContaining([expect.objectContaining({ category: "model-generation" })])
);
```

- [ ] **Step 5: Run tests and confirm red state**

Run:

```bash
npm test
```

Expected: new regression tests fail against current implementation.

## Task 2: Structured Types and Schemas

**Files:**
- Modify: `src/agent/types.ts`
- Create: `src/model/packageSchemas.ts`
- Modify: `src/generators/packageWriter.ts`
- Test: `tests/contextPackage.test.ts`

- [ ] **Step 1: Add structured types**

Extend existing types with optional fields to preserve compatibility:

```ts
export type UnresolvedCategory =
  | "project-profile"
  | "route"
  | "api-contract"
  | "component-props"
  | "request-wrapper"
  | "permission"
  | "dictionary"
  | "business-field"
  | "model-generation"
  | "schema-validation";

export interface GovernanceUnresolvedItem {
  source: string;
  category: UnresolvedCategory;
  message: string;
  filePath?: string;
  severity: "info" | "warning" | "error";
}

export interface GenerationStatusItem {
  artifact: string;
  skill: string;
  status: "model" | "fallback" | "failed";
  reason?: string;
}
```

- [ ] **Step 2: Add Zod schemas**

Create schemas for project profile, inventory arrays, evidence snippets, unresolved items, rules, templates, examples, and generation status. Export a helper:

```ts
export function validatePackageArtifact<T>(name: string, value: unknown, schema: ZodSchema<T>): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new Error(`Package artifact validation failed: ${name}: ${parsed.error.message}`);
  }
  return parsed.data;
}
```

- [ ] **Step 3: Add schema-aware writer**

Add:

```ts
export async function writeValidatedPackageJson<T>(
  root: string,
  relativePath: string,
  value: unknown,
  schema: ZodSchema<T>
): Promise<T> {
  const parsed = validatePackageArtifact(relativePath, value, schema);
  await writePackageJson(root, relativePath, parsed);
  return parsed;
}
```

- [ ] **Step 4: Run focused tests**

Run:

```bash
npm test -- tests/contextPackage.test.ts
```

Expected: schema helper tests pass after implementation.

## Task 3: Inventory Enrichment and Unresolved Items

**Files:**
- Modify: `src/scanners/projectScanner.ts`
- Modify: `src/scanners/inventoryHelpers.ts`
- Modify: `src/scanners/vueScanner.ts`
- Modify: `src/scanners/reactScanner.ts`
- Test: `tests/projectDetect.test.ts`
- Test: `tests/sourceInventory.test.ts`

- [ ] **Step 1: Extend project detection**

Detect package manager from lock files, source directories from existing common dirs, state management dependencies, fetch/request signals, CSS modules, and UnoCSS. Keep uncertain values out of the profile and add confirmation items when required facts are missing.

- [ ] **Step 2: Add route/API/props extractors**

Implement small helper functions that read file text and extract only literal/static values:

```ts
export function extractRoutePaths(content: string): string[] {
  return [...content.matchAll(/path\s*:\s*["'`]([^"'`]+)["'`]/g)].map((match) => match[1]);
}

export function extractApiFacts(content: string): Array<{ method?: string; path?: string }> {
  const methods = ["get", "post", "put", "patch", "delete"];
  return methods.flatMap((method) =>
    [...content.matchAll(new RegExp(`\\.${method}\\s*\\(\\s*["'\`]([^"'\`]+)["'\`]`, "g"))].map(
      (match) => ({ method, path: match[1] })
    )
  );
}
```

- [ ] **Step 3: Enrich inventory items**

Update scanners to read candidate files, attach extracted route/API/props facts, and emit unresolved items when fields remain unknown.

- [ ] **Step 4: Add relationship evidence**

Infer page-to-API relations from import/reference text before falling back to name matching. Include confidence and evidence description.

- [ ] **Step 5: Run focused tests**

Run:

```bash
npm test -- tests/projectDetect.test.ts tests/sourceInventory.test.ts
```

Expected: detection and inventory tests pass.

## Task 4: Bounded Evidence Snippets

**Files:**
- Modify: `src/evidence/evidencePackage.ts`
- Modify: `src/skills/contextDocGenerate.ts`
- Test: `tests/evidencePackage.test.ts`

- [ ] **Step 1: Make evidence snippet building async**

Change evidence construction so file content can be read before writing evidence. If preserving a sync `buildEvidencePackage` is necessary for compatibility, add `buildEvidencePackageWithSnippets` and migrate the generation path to it.

- [ ] **Step 2: Implement deterministic selection**

Sort and de-duplicate candidate paths, then apply priority ordering by file role. Keep output stable across runs.

- [ ] **Step 3: Enforce limits**

Apply max files, max lines per file, max bytes per file, and total bytes. Set `truncated: true` when any content is cut.

- [ ] **Step 4: Preserve bounded evidence only**

Ensure files beyond limits remain in `fileTree.candidateFiles` but do not appear as full snippet content.

- [ ] **Step 5: Run focused tests**

Run:

```bash
npm test -- tests/evidencePackage.test.ts
```

Expected: snippets contain bounded content and stable metadata.

## Task 5: Generation Status and Failure Reporting

**Files:**
- Modify: `src/skills/contextDocGenerate.ts`
- Modify: `src/skills/userSkillGenerate.ts`
- Modify: `src/evidence/evidencePackage.ts`
- Modify: `src/generators/templates.ts`
- Test: `tests/modelAssistedGeneration.test.ts`
- Test: `tests/contextPackage.test.ts`

- [ ] **Step 1: Track artifact generation status**

Record status for governance report, Qwen context policy, and user Skill generation. Use `fallback` for model unavailable, `failed` for invalid model output, and `model` for accepted model output.

- [ ] **Step 2: Convert validation failures to recorded failures**

For model Markdown validation failures, reject the invalid model text, record a `model-generation` unresolved item, and use a deterministic fallback only when the failure policy allows it.

- [ ] **Step 3: Render status in governance report**

Add governance report sections for fallback-generated artifacts and failed model artifacts.

- [ ] **Step 4: Validate JSON writes**

Use schema-aware writes for known `.evidence` and `.ai-index` artifacts. On schema failure, record a `schema-validation` unresolved item and do not write invalid JSON.

- [ ] **Step 5: Run focused tests**

Run:

```bash
npm test -- tests/modelAssistedGeneration.test.ts tests/contextPackage.test.ts
```

Expected: invalid model output and schema mismatch are visible in report/unresolved data.

## Task 6: Policy and Skill Constraint Alignment

**Files:**
- Modify: `src/generators/templates.ts`
- Modify: `src/skills/userSkillGenerate.ts`
- Test: `tests/userSkillGenerate.test.ts`
- Test: `tests/contextPackage.test.ts`

- [ ] **Step 1: Centralize constraints**

Create one shared constraints list in the generator layer and render it to Markdown and JSON.

- [ ] **Step 2: Update Qwen output format**

Require plan first, user confirmation before execution prompt, scoped expected changed files, uncertainty markers, and no unrelated edits before patch/code output.

- [ ] **Step 3: Update generated Skill**

Ensure the generated Skill instructs prompt assembly from minimal relevant `.ai-index`, `.ai-context`, `docs/ai`, templates, examples, and bounded evidence.

- [ ] **Step 4: Run focused tests**

Run:

```bash
npm test -- tests/userSkillGenerate.test.ts tests/contextPackage.test.ts
```

Expected: all required constraints appear consistently across artifacts.

## Task 7: Full Verification

**Files:**
- Modify: `openspec/changes/close-spec-gaps/tasks.md`

- [ ] **Step 1: Run complete test suite**

Run:

```bash
npm test
```

Expected: all Vitest files pass with zero failed tests.

- [ ] **Step 2: Run TypeScript build**

Run:

```bash
npm run build
```

Expected: `tsc -p tsconfig.json` exits 0.

- [ ] **Step 3: Validate OpenSpec change**

Run:

```bash
node_modules/.bin/openspec.cmd validate close-spec-gaps
```

Expected: `Change 'close-spec-gaps' is valid`.

- [ ] **Step 4: Generate a fixture package and inspect outputs**

Run the CLI against one existing fixture and inspect `.evidence`, `.ai-index`, `.ai-context`, `.ai-skill`, and governance report for the new fields and status summaries.

- [ ] **Step 5: Mark verified tasks complete and commit**

After each completed task group, update `openspec/changes/close-spec-gaps/tasks.md` from `- [ ]` to `- [x]` for completed items and commit the corresponding code/test changes.

## Self-Review

- Spec coverage: every requirement in the four `close-spec-gaps` delta specs maps to at least one task above.
- Placeholder scan: no unfilled placeholders are present; references to uncertainty markers are product behavior, not plan placeholders.
- Type consistency: structured unresolved items and generation status names are introduced in Task 2 and reused consistently in later tasks.
