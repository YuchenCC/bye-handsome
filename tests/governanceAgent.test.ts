import { access, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { runGovernanceAgent } from "../src/agent/governanceAgent.js";

const outputRoots: string[] = [];

describe("runGovernanceAgent", () => {
  afterEach(async () => {
    await Promise.all(
      outputRoots.splice(0).map((root) => rm(root, { recursive: true, force: true }))
    );
  });

  it("orchestrates project detection through context package generation", async () => {
    const outputPath = await mkdtemp(join(tmpdir(), "governance-agent-test-"));
    outputRoots.push(outputPath);

    await runGovernanceAgent({
      inputPath: "tests/fixtures/jupui-vue2",
      outputPath,
      model: {}
    });

    await expect(access(join(outputPath, "AGENT_USAGE.md"))).resolves.toBeUndefined();
    await expect(access(join(outputPath, "docs/ai/governance-report.md"))).resolves.toBeUndefined();
    await expect(access(join(outputPath, ".ai-index/project-profile.json"))).resolves.toBeUndefined();
    await expect(
      access(join(outputPath, ".ai-skill/ai-coding-guide/SKILL.md"))
    ).resolves.toBeUndefined();
  });
});
