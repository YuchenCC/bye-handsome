import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  createGovernanceSkillRegistry,
  renderSkillRegistryMarkdown,
  writeGovernanceSkillRegistry
} from "../src/skills/registry.js";

const testRoots: string[] = [];

describe("governance Skill registry", () => {
  afterEach(async () => {
    await Promise.all(
      testRoots.splice(0).map((root) => rm(root, { recursive: true, force: true }))
    );
  });

  it("declares required callable governance Skills and safety boundaries", () => {
    const registry = createGovernanceSkillRegistry();
    const names = registry.skills.map((skill) => skill.name);

    expect(names).toEqual([
      "project-detect-skill",
      "source-inventory-skill",
      "example-template-skill",
      "context-doc-generate-skill",
      "qwen-context-policy-generate-skill",
      "governance-report-generate-skill",
      "user-ai-coding-skill-generate-skill"
    ]);

    for (const skill of registry.skills) {
      expect(skill.purpose.length).toBeGreaterThan(0);
      expect(skill.inputs.length).toBeGreaterThan(0);
      expect(skill.outputs.length).toBeGreaterThan(0);
      expect(skill.allowedActions.length).toBeGreaterThan(0);
      expect(skill.validationPolicy.length).toBeGreaterThan(0);
      expect(skill.failurePolicy.length).toBeGreaterThan(0);
    }

    const modelSkills = registry.skills.filter((skill) => skill.modelRequired);
    expect(modelSkills.length).toBeGreaterThan(0);
    for (const skill of modelSkills) {
      expect(skill.forbiddenActions).toContain("business source-code patch generation");
      expect(skill.forbiddenActions).toContain("scanned project source modification");
    }
  });

  it("renders and writes registry artifacts for humans and model orchestration", async () => {
    const outputPath = await mkdtemp(join(tmpdir(), "skill-registry-test-"));
    testRoots.push(outputPath);

    const markdown = renderSkillRegistryMarkdown(createGovernanceSkillRegistry());
    expect(markdown).toContain("# Governance Skill Registry");
    expect(markdown).toContain("context-doc-generate-skill");
    expect(markdown).toContain("business source-code patch generation");

    await writeGovernanceSkillRegistry(outputPath);

    const jsonPath = join(outputPath, "governance-skills/skill-registry.json");
    const markdownPath = join(outputPath, "governance-skills/SKILL_REGISTRY.md");
    await expect(access(jsonPath)).resolves.toBeUndefined();
    await expect(access(markdownPath)).resolves.toBeUndefined();

    const registry = JSON.parse(await readFile(jsonPath, "utf8")) as ReturnType<
      typeof createGovernanceSkillRegistry
    >;
    expect(registry.skills[0].name).toBe("project-detect-skill");
  });
});
