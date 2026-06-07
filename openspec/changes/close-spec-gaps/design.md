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

## Migration Plan

1. Add failing tests for the reviewed gaps.
2. Implement structured unresolved items and generation status plumbing.
3. Enhance deterministic scanner extraction in narrow, common patterns.
4. Populate bounded snippets and validate limits.
5. Add schema validation for `.evidence` and `.ai-index`.
6. Update templates/policies to use shared constraints and report fallback/failure status.
7. Run `npm test`, `npm run build`, and OpenSpec validation for this change.

## Open Questions

- Should structured unresolved items replace the current string-only shape immediately, or should both shapes be supported for one iteration?
- Should Vue props extraction cover only Options API and `defineProps`, or also class-style Vue 2 patterns?
- Should generation status be stored only in governance report or also as a machine-readable `.evidence/generation-status.json` file?
