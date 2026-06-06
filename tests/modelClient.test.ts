import { z } from "zod";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  assertGovernanceModelOutputKind,
  assertGovernanceModelPurpose,
  createModelClient
} from "../src/model/modelClient.js";
import { parseModelJson } from "../src/model/schemaValidation.js";

const documentationRequest = {
  purpose: "documentation",
  outputKind: "markdown-doc",
  system: "Summarize",
  input: { ok: true }
} as const;

describe("model invocation boundary", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("blocks business patch model purposes", () => {
    expect(() => assertGovernanceModelPurpose("business-patch")).toThrow(
      "Blocked out-of-scope model purpose"
    );
  });

  it("blocks unknown model purposes", () => {
    expect(() => assertGovernanceModelPurpose("component-generation")).toThrow(
      "Blocked out-of-scope model purpose"
    );
  });

  it("blocks business patch output kinds even for documentation purposes", async () => {
    const client = createModelClient({ useCurrentSession: true });

    await expect(
      client.generateText({
        ...documentationRequest,
        outputKind: "business-patch"
      } as never)
    ).rejects.toThrow("Blocked out-of-scope model output kind");
  });

  it("blocks source code patch and unknown output kinds", () => {
    expect(() => assertGovernanceModelOutputKind("source-code-patch")).toThrow(
      "Blocked out-of-scope model output kind"
    );
    expect(() => assertGovernanceModelOutputKind("unknown-kind")).toThrow(
      "Blocked out-of-scope model output kind"
    );
  });

  it("requires explicit model or current-session mode", async () => {
    const client = createModelClient({});

    await expect(client.generateText(documentationRequest)).rejects.toThrow(
      "No model configured"
    );
  });

  it("rejects partial configured API model options", () => {
    expect(() =>
      createModelClient({
        provider: "openai-compatible",
        model: "qwen"
      })
    ).toThrow("Configured API model requires provider, model, baseUrl, and apiKey");
  });

  it("throws a clear current-session interactive handling error", async () => {
    const client = createModelClient({ useCurrentSession: true });

    await expect(client.generateText(documentationRequest)).rejects.toThrow(
      "Current-session model task requires interactive handling"
    );
  });

  it("posts configured API requests and returns first message content", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "Generated doc" } }]
      })
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = createModelClient({
      provider: "openai-compatible",
      model: "qwen",
      baseUrl: "https://model.example/v1/",
      apiKey: "secret"
    });

    await expect(client.generateText(documentationRequest)).resolves.toBe("Generated doc");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://model.example/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer secret"
        }
      })
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toEqual({
      model: "qwen",
      messages: [
        { role: "system", content: "Summarize" },
        { role: "user", content: JSON.stringify({ ok: true }) }
      ]
    });
  });

  it("throws configured API non-2xx responses with response body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => "upstream failure"
      })
    );

    const client = createModelClient({
      provider: "openai-compatible",
      model: "qwen",
      baseUrl: "https://model.example/v1",
      apiKey: "secret"
    });

    await expect(client.generateText(documentationRequest)).rejects.toThrow(
      "Model request failed: 500 upstream failure"
    );
  });

  it("throws when configured API response has empty content", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ choices: [{ message: { content: "" } }] })
      })
    );

    const client = createModelClient({
      provider: "openai-compatible",
      model: "qwen",
      baseUrl: "https://model.example/v1",
      apiKey: "secret"
    });

    await expect(client.generateText(documentationRequest)).rejects.toThrow(
      "Model response did not contain message content"
    );
  });

  it("parses model JSON using a Zod schema", () => {
    const schema = z.object({
      title: z.string(),
      count: z.number()
    });

    const parsed = parseModelJson('{"title":"Governance","count":2}', schema);

    expect(parsed).toEqual({ title: "Governance", count: 2 });
  });

  it("adds model-output validation context for malformed JSON", () => {
    expect(() => parseModelJson("{not-json", z.object({}))).toThrow(
      "Model output validation failed: invalid JSON"
    );
  });

  it("adds model-output validation context for schema failures", () => {
    expect(() =>
      parseModelJson('{"title":"Governance"}', z.object({ count: z.number() }))
    ).toThrow("Model output validation failed: schema mismatch");
  });
});
