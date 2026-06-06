## ADDED Requirements

### Requirement: Independent context package
The system SHALL output an independent `ai-context-package` directory rather than writing generated context directly into the scanned project.

#### Scenario: Governance run completes
- **WHEN** all required generation steps complete
- **THEN** the output SHALL include an `ai-context-package` directory

### Requirement: Chinese docs output
The system SHALL generate human-readable context documents in Chinese under `docs/ai`.

#### Scenario: docs generation completes
- **WHEN** the context document generation Skill runs successfully
- **THEN** `docs/ai` SHALL include Chinese documents for system profile, page inventory, component inventory, API inventory, AI coding rules, user guide, and governance report

### Requirement: Machine index output
The system SHALL generate `.ai-index` JSON files for machine retrieval and prompt assembly.

#### Scenario: index generation completes
- **WHEN** structured scan results are available
- **THEN** `.ai-index` SHALL include JSON indexes for project profile, pages, components, APIs, routes, templates, examples, and rules

### Requirement: Qwen context policy output
The system SHALL generate `.ai-context` files for Qwen2.5-Coder-32B context selection, output format, plan-do policy, and quality check policy.

#### Scenario: Qwen policy generation completes
- **WHEN** context strategy files are generated
- **THEN** `.ai-context` SHALL include system prompt, context policy, output format, plan-do policy, and quality check files

### Requirement: User Skill package output
The system SHALL generate `.ai-skill/ai-coding-guide` as part of the context package.

#### Scenario: user guide Skill generation completes
- **WHEN** the user Skill generation step completes
- **THEN** `.ai-skill/ai-coding-guide` SHALL contain a `SKILL.md`, templates, checks, and installation or usage instructions

### Requirement: Minimal context selection policy
The system SHALL document a policy that prevents injecting all project documentation or all source code into one model request.

#### Scenario: context policy is generated
- **WHEN** `.ai-context/qwen32b-context-policy.md` is produced
- **THEN** it SHALL limit each task to AI coding rules, one task template, a small number of similar pages, related components, service examples, and quality check rules
