## ADDED Requirements

### Requirement: Unified model invocation layer
The system SHALL route all large language model calls through a unified Agent-managed invocation layer.

#### Scenario: Skill needs model summarization
- **WHEN** a Skill requires model assistance for summarization or document generation
- **THEN** the Skill SHALL provide structured input and expected output schema to the Agent-managed model invocation layer

### Requirement: Configured model provider
The system SHALL support explicit configured model providers.

#### Scenario: API model configuration is provided
- **WHEN** provider, model, base URL, and API key configuration is available
- **THEN** the Agent SHALL be able to call that configured model for approved governance tasks

### Requirement: Current-session model provider
The system SHALL support using the model available in the current operating context when applicable.

#### Scenario: Agent runs inside an interactive Codex CLI session
- **WHEN** no explicit API model is configured and current-session model use is enabled
- **THEN** the Agent SHALL allow model-assisted governance steps to be completed through the current interactive model context

### Requirement: Deterministic scan before model summarization
The system SHALL perform deterministic scanning before model summarization.

#### Scenario: Documentation generation requires model assistance
- **WHEN** the Agent needs to generate narrative documentation
- **THEN** it SHALL first provide the model with bounded structured scan results rather than raw full-project source context

### Requirement: Model output validation
The system SHALL validate model outputs against a JSON schema or fixed Markdown template before writing generated artifacts.

#### Scenario: Model output does not match expected schema
- **WHEN** the model returns malformed or incomplete output
- **THEN** the Agent SHALL retry within a configured limit or record the failure as an exception or manual confirmation item

### Requirement: No model-generated business patch
The system SHALL prevent model calls from producing business source code patches during governance runs.

#### Scenario: Model task is prepared
- **WHEN** the prepared model task asks for business code generation or source patch output
- **THEN** the Agent SHALL block the task and report it as out of scope
