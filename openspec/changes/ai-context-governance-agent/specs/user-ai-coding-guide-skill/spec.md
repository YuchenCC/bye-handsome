## ADDED Requirements

### Requirement: Plan-do workflow
The generated user AI Coding guide Skill SHALL follow a plan-do workflow before producing Qwen2.5-Coder-32B task prompts.

#### Scenario: User submits a simple development request
- **WHEN** the user provides a natural language AI Coding request
- **THEN** the Skill SHALL identify task type, extract key fields, read context indexes, produce a plan, and ask for confirmation before generating the Qwen task prompt

### Requirement: Context retrieval
The generated user AI Coding guide Skill SHALL retrieve relevant context from `.ai-index` and `.ai-context`.

#### Scenario: Modify existing page task
- **WHEN** the user asks to modify an existing page
- **THEN** the Skill SHALL retrieve related page, component, API, template, rule, and Qwen policy context before generating a prompt

### Requirement: MVP task types
The generated user AI Coding guide Skill SHALL support create list page, modify existing page, connect API, and fix error tasks in MVP.

#### Scenario: Supported task is submitted
- **WHEN** the user request matches one of the four MVP task types
- **THEN** the Skill SHALL generate a structured plan and Qwen-compatible task prompt for that task type

### Requirement: Missing field confirmation
The generated user AI Coding guide Skill SHALL request user confirmation when required task fields are missing or ambiguous.

#### Scenario: API method is missing
- **WHEN** a task requires an API method but the user did not provide one and no matching API exists in context
- **THEN** the Skill SHALL ask the user to confirm or provide the API method instead of guessing

### Requirement: Small model constraints
The generated user AI Coding guide Skill SHALL include small-model constraints in Qwen task prompts.

#### Scenario: Prompt is generated
- **WHEN** the Skill generates a Qwen2.5-Coder-32B task prompt
- **THEN** the prompt SHALL forbid invented imports, new third-party dependencies, invented components, invented APIs, request wrapper bypasses, unconfirmed fields, unrelated file edits, and unrequested large refactors

### Requirement: TODO for uncertain fields
The generated user AI Coding guide Skill SHALL require Qwen to use `TODO` for uncertain fields rather than guessing.

#### Scenario: Field semantics are unclear
- **WHEN** a required business field cannot be confirmed from user input or context
- **THEN** the generated prompt SHALL instruct Qwen to mark the field with `TODO`

### Requirement: Changed-file ESLint check
The generated user AI Coding guide Skill SHALL perform or guide a changed-file ESLint check after code generation.

#### Scenario: Qwen outputs code changes
- **WHEN** code changes have been applied in the target project
- **THEN** the Skill SHALL identify changed frontend source files and run or guide ESLint checks for those files only

### Requirement: ESLint repair prompt
The generated user AI Coding guide Skill SHALL produce a repair prompt when changed-file ESLint reports errors.

#### Scenario: ESLint returns errors
- **WHEN** the changed-file ESLint check reports errors
- **THEN** the Skill SHALL summarize the errors and generate a constrained repair prompt for Qwen or the developer
