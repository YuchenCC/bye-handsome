import { z } from "zod";
import { describe, expect, it } from "vitest";
import {
  assertGovernanceModelPurpose,
  createModelClient
} from "../src/model/modelClient.js";
import { parseModelJson } from "../src/model/schemaValidation.js";

describe("model invocation boundary", () => {
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

  it("requires explicit model or current-session mode", async () => {
    const client = createModelClient({});

    await expect(
      client.generateText({
        purpose: "documentation",
        system: "Summarize",
        input: { ok: true }
      })
    ).rejects.toThrow("No model configured");
  });

  it("parses model JSON using a Zod schema", () => {
    const schema = z.object({
      title: z.string(),
      count: z.number()
    });

    const parsed = parseModelJson('{"title":"Governance","count":2}', schema);

    expect(parsed).toEqual({ title: "Governance", count: 2 });
  });
});
