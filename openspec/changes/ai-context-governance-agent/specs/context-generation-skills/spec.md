## ADDED Requirements

### Requirement: Project detection Skill
The system SHALL provide a `project-detect-skill` that identifies project stack, dependencies, commands, directories, and code standards.

#### Scenario: package metadata exists
- **WHEN** `package.json` and related config files exist
- **THEN** the Skill SHALL output a structured project profile and recommended scan strategy

### Requirement: Source inventory Skill
The system SHALL provide a `source-inventory-skill` that scans pages, routes, components, APIs, request wrappers, and basic page-to-API relationships.

#### Scenario: Pages and services exist
- **WHEN** the project contains page files and service files
- **THEN** the Skill SHALL output structured page, route, component, and API inventories

### Requirement: Example template Skill
The system SHALL provide an `example-template-skill` that extracts high-relevance examples and templates from the scanned project.

#### Scenario: Similar list pages exist
- **WHEN** the project contains list page examples
- **THEN** the Skill SHALL extract list page examples with usage context, reference files, reusable components, naming rules, forbidden actions, and confirmation items

### Requirement: Context document generation Skill
The system SHALL provide a `context-doc-generate-skill` that converts structured scan results into Chinese documentation, JSON indexes, and Qwen context strategy files.

#### Scenario: Structured scan results are available
- **WHEN** project profile, inventories, and examples have been produced
- **THEN** the Skill SHALL generate `docs/ai`, `.ai-index`, and `.ai-context` outputs

### Requirement: User Skill generation Skill
The system SHALL provide a `user-ai-coding-skill-generate-skill` that generates a reusable user AI Coding guide Skill directory.

#### Scenario: Context package generation is complete
- **WHEN** `docs/ai`, `.ai-index`, and `.ai-context` have been generated
- **THEN** the Skill SHALL generate `.ai-skill/ai-coding-guide` with a `SKILL.md`, templates, checks, and usage instructions

### Requirement: Medium-grained external Skill boundary
The system SHALL expose medium-grained Skills externally while allowing internal scanners to vary by frontend stack.

#### Scenario: Vue2 project is detected
- **WHEN** the project profile identifies Vue2
- **THEN** downstream Skills MAY use Vue2-specific internal scanners without requiring a separate externally exposed Vue2 Skill
