import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { ProjectProfile } from "../src/agent/types.js";
import { userAiCodingSkillGenerateSkill } from "../src/skills/userSkillGenerate.js";

const testRoots: string[] = [];

const profile: ProjectProfile = {
  root: "/target/project",
  stack: "react",
  stackEvidence: ["dependency:react"],
  uiFrameworks: ["antd"],
  qualityConfig: [],
  commands: { lint: "eslint src --ext .js,.jsx,.ts,.tsx" },
  sourceDirs: ["src"],
  confirmationItems: []
};

describe("userAiCodingSkillGenerateSkill", () => {
  afterEach(async () => {
    await Promise.all(
      testRoots.splice(0).map((root) => rm(root, { recursive: true, force: true }))
    );
  });

  it("writes the guide Skill, templates, checks, and small-model constraints", async () => {
    const outputPath = await mkdtemp(join(tmpdir(), "user-skill-test-"));
    testRoots.push(outputPath);

    await userAiCodingSkillGenerateSkill({ outputPath, profile });

    const skillPath = join(outputPath, ".ai-skill/ai-coding-guide/SKILL.md");
    await expect(access(skillPath)).resolves.toBeUndefined();
    await expect(
      access(join(outputPath, ".ai-skill/ai-coding-guide/templates/create-list-page.md"))
    ).resolves.toBeUndefined();
    await expect(
      access(join(outputPath, ".ai-skill/ai-coding-guide/checks/eslint-changed-files.md"))
    ).resolves.toBeUndefined();

    const skill = await readFile(skillPath, "utf8");
    expect(skill).toContain("plan-do");
    expect(skill).toContain(".ai-index");
    expect(skill).toContain(".ai-context");
    expect(skill).toContain("ESLint");
    expect(skill).toContain("不得发明不存在的 import。");
    expect(skill).toContain("不得新增第三方依赖。");
    expect(skill).toContain("不得编造项目中不存在的组件。");
    expect(skill).toContain("不得编造接口方法。");
    expect(skill).toContain("字段不确定时必须使用 TODO。");
    expect(skill).toContain("不得修改无关文件。");
  });
});
