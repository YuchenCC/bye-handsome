import { contextDocGenerateSkill } from "../skills/contextDocGenerate.js";
import { exampleTemplateSkill } from "../skills/exampleTemplate.js";
import { projectDetectSkill } from "../skills/projectDetect.js";
import { sourceInventorySkill } from "../skills/sourceInventory.js";
import { userAiCodingSkillGenerateSkill } from "../skills/userSkillGenerate.js";
import { prepareWorkspace } from "./input.js";
import type { GovernanceAgentOptions } from "./types.js";

export async function runGovernanceAgent(options: GovernanceAgentOptions): Promise<void> {
  const workspace = await prepareWorkspace(options.inputPath);

  try {
    const profile = await projectDetectSkill(workspace.workspacePath);
    const inventory = await sourceInventorySkill(profile);
    const templates = await exampleTemplateSkill(inventory);

    await contextDocGenerateSkill({
      outputPath: options.outputPath,
      profile,
      inventory,
      templates
    });

    await userAiCodingSkillGenerateSkill({
      outputPath: options.outputPath,
      profile
    });
  } finally {
    await workspace.cleanup();
  }
}
