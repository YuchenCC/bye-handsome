## ADDED Requirements

### Requirement: Source input handling
The system SHALL allow the governance Agent to accept either a single frontend source zip or a single local frontend project directory as input.

#### Scenario: Zip input is provided
- **WHEN** the user provides a single source zip
- **THEN** the Agent SHALL extract it into a temporary workspace for scanning

#### Scenario: Local directory input is provided
- **WHEN** the user provides a local frontend project directory
- **THEN** the Agent SHALL scan that directory without modifying source files

### Requirement: Project profile detection
The system SHALL generate a project profile before invoking downstream scanning Skills.

#### Scenario: Supported frontend project is detected
- **WHEN** the project contains recognizable frontend dependencies, config files, or source directories
- **THEN** the Agent SHALL identify the likely technology stack, build tool, UI framework, request layer, routing style, style system, commands, and code quality config

### Requirement: Jupui Vue2 rule
The system SHALL classify a project as Vue2 when the project dependencies include `jupui`.

#### Scenario: jupui dependency exists
- **WHEN** `jupui` appears in project dependencies
- **THEN** the Agent SHALL select the Vue2 scanning strategy

### Requirement: Workflow orchestration
The system SHALL orchestrate context generation Skills according to the project profile.

#### Scenario: Project profile is complete
- **WHEN** project detection produces a supported project profile
- **THEN** the Agent SHALL invoke inventory scanning, example extraction, context document generation, and user guide Skill generation in sequence

### Requirement: Agent non-generation boundary
The governance Agent SHALL NOT directly invoke Qwen2.5-Coder-32B to generate business code.

#### Scenario: Context package is generated
- **WHEN** the Agent finishes generating the context package
- **THEN** the Agent SHALL stop without generating business code or applying patches to the scanned project

### Requirement: Governance report
The system SHALL produce a governance report that records scan results, missing information, errors, and manual confirmation items.

#### Scenario: Scanner cannot identify a route config
- **WHEN** route configuration cannot be reliably identified
- **THEN** the governance report SHALL include the missing route config as a manual confirmation item

### Requirement: Agent usage documentation
The system SHALL provide usage documentation for the governance Agent itself.

#### Scenario: User wants to run the governance Agent
- **WHEN** the user reads the Agent usage documentation
- **THEN** the documentation SHALL explain prerequisites, supported inputs, run flow, output package structure, how to inspect results, how to copy the context package, and common troubleshooting steps

### Requirement: Controlled model invocation boundary
The governance Agent SHALL be allowed to invoke large language models for context summarization, documentation generation, context policy generation, and user guide Skill generation, but SHALL NOT invoke models to generate business code patches.

#### Scenario: Model-assisted documentation generation
- **WHEN** deterministic scan results are available
- **THEN** the Agent MAY invoke a configured model or current-session model to summarize and generate context documentation from those scan results

#### Scenario: Business code generation requested during governance
- **WHEN** a model task would generate or apply business source code changes
- **THEN** the Agent SHALL reject that task as outside the governance boundary
