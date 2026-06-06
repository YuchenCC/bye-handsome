import type { ModelOptions } from "../agent/types.js";

const GOVERNANCE_MODEL_PURPOSES = [
  "documentation",
  "context-policy",
  "user-skill"
] as const;

export type GovernanceModelPurpose = (typeof GOVERNANCE_MODEL_PURPOSES)[number];

export interface ModelRequest {
  purpose: GovernanceModelPurpose;
  system: string;
  input: unknown;
}

export interface ModelClient {
  generateText(request: ModelRequest): Promise<string>;
}

export function createModelClient(options: ModelOptions): ModelClient {
  if (options.provider && options.model && options.baseUrl && options.apiKey) {
    return new ConfiguredApiModelClient(options);
  }

  if (options.useCurrentSession) {
    return new CurrentSessionModelClient();
  }

  return new NoopModelClient();
}

export function assertGovernanceModelPurpose(
  purpose: string
): asserts purpose is GovernanceModelPurpose {
  if (!GOVERNANCE_MODEL_PURPOSES.includes(purpose as GovernanceModelPurpose)) {
    throw new Error(`Blocked out-of-scope model purpose: ${purpose}`);
  }
}

class ConfiguredApiModelClient implements ModelClient {
  constructor(private readonly options: ModelOptions) {}

  async generateText(request: ModelRequest): Promise<string> {
    assertGovernanceModelPurpose(request.purpose);

    const response = await fetch(`${this.options.baseUrl!.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.options.apiKey}`
      },
      body: JSON.stringify({
        model: this.options.model,
        messages: [
          { role: "system", content: request.system },
          { role: "user", content: JSON.stringify(request.input) }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Model request failed: ${response.status} ${await response.text()}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("Model response did not contain message content");
    }

    return content;
  }
}

class CurrentSessionModelClient implements ModelClient {
  async generateText(request: ModelRequest): Promise<string> {
    assertGovernanceModelPurpose(request.purpose);
    throw new Error(
      `Current-session model task requires interactive handling. Purpose: ${request.purpose}`
    );
  }
}

class NoopModelClient implements ModelClient {
  async generateText(request: ModelRequest): Promise<string> {
    assertGovernanceModelPurpose(request.purpose);
    throw new Error(`No model configured for governance task: ${request.purpose}`);
  }
}
