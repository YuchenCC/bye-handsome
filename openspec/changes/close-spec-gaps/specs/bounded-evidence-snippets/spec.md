## ADDED Requirements

### Requirement: Evidence snippets contain bounded source content
The system SHALL write selected source snippets with actual content in `.evidence/snippets.json` while respecting configured limits.

#### Scenario: Candidate files are selected for evidence
- **WHEN** candidate page, component, API, route, request wrapper, template, or example files exist
- **THEN** `.evidence/snippets.json` SHALL include bounded content for selected files instead of empty placeholder strings

### Requirement: Snippet truncation metadata
The system SHALL record truncation metadata for each snippet and enforce global evidence limits.

#### Scenario: Candidate file exceeds snippet limits
- **WHEN** a selected file exceeds per-file line limits, per-file byte limits, or the remaining total byte budget
- **THEN** the snippet SHALL be truncated, `truncated` SHALL be true, and the recorded content SHALL stay within the configured limits

### Requirement: Deterministic snippet selection
The system SHALL select snippets deterministically so repeated runs on the same input produce stable evidence.

#### Scenario: Multiple candidate files are available
- **WHEN** the evidence package is built for the same project content more than once
- **THEN** snippet item ordering and selected file paths SHALL be stable

### Requirement: No full source injection
The system SHALL NOT include the full source tree or all candidate file contents in the evidence package.

#### Scenario: Project has more candidates than the snippet limit
- **WHEN** candidate files exceed configured snippet limits
- **THEN** the evidence package SHALL include only the selected bounded snippets and SHALL preserve the remaining files as candidate paths only
