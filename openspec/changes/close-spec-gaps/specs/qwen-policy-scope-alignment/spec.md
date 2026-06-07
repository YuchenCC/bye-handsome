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
