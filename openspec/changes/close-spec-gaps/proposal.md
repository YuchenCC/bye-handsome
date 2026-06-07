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
