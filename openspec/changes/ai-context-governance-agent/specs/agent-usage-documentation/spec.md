## ADDED Requirements

### Requirement: Agent usage guide
The system SHALL include a dedicated Agent usage guide that describes how to operate the governance Agent.

#### Scenario: Agent usage guide is generated or packaged
- **WHEN** the project documentation is prepared
- **THEN** the guide SHALL explain installation, source zip input, local project directory input, expected output, and completion criteria

### Requirement: Output interpretation guide
The Agent usage guide SHALL explain how to interpret generated outputs.

#### Scenario: User reviews generated context package
- **WHEN** the user opens the usage guide after a governance run
- **THEN** the guide SHALL explain `docs/ai`, `.ai-index`, `.ai-context`, `.ai-skill/ai-coding-guide`, and `governance-report.md`

### Requirement: Context package copy guide
The Agent usage guide SHALL explain how to copy generated outputs into the target engineering project.

#### Scenario: User prepares target project for AI Coding
- **WHEN** the user wants to use generated context in a target project
- **THEN** the guide SHALL distinguish copying context package files from running the generated user AI Coding guide Skill

### Requirement: Troubleshooting guide
The Agent usage guide SHALL include common troubleshooting guidance.

#### Scenario: Governance run has missing or ambiguous scan results
- **WHEN** the governance report lists manual confirmation items
- **THEN** the guide SHALL explain how to review missing items, decide whether to accept partial output, and rerun after correcting inputs
