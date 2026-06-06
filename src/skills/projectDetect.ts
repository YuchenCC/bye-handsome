import type { ProjectProfile } from "../agent/types.js";
import { scanProjectProfile } from "../scanners/projectScanner.js";

export async function projectDetectSkill(root: string): Promise<ProjectProfile> {
  return scanProjectProfile(root);
}
