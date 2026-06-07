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
