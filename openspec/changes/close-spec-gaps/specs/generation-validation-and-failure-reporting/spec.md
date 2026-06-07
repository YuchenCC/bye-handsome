## ADDED Requirements

### Requirement: JSON artifact schema validation
The system SHALL validate generated JSON artifacts against schemas before writing them to the context package.

#### Scenario: JSON artifact does not match schema
- **WHEN** a generated JSON artifact is missing required fields or contains an invalid shape
- **THEN** the system SHALL reject the invalid artifact and record the failure instead of writing invalid JSON

### Requirement: Markdown generation failure recording
The system SHALL record model-generated Markdown validation failures in governance outputs.

#### Scenario: Model Markdown fails validation
- **WHEN** model-generated Markdown is missing required sections or contains forbidden business patch content
- **THEN** the system SHALL reject that model output and record the failed artifact, skill name, and validation reason in unresolved items or the governance report

### Requirement: Fallback status visibility
The system SHALL make deterministic fallback status visible both inside fallback artifacts and in the governance report.

#### Scenario: Model is unavailable
- **WHEN** a model-assisted artifact is produced by deterministic fallback
- **THEN** the artifact SHALL include the fallback marker and the governance report SHALL list that artifact as fallback-generated

### Requirement: Partial failure behavior
The system SHALL avoid losing all successful deterministic outputs when one model-assisted artifact fails validation.

#### Scenario: One model-assisted artifact is invalid
- **WHEN** a model-assisted artifact fails validation after configured handling
- **THEN** the system SHALL write valid deterministic artifacts, record the failed artifact status, and avoid writing the invalid model output
