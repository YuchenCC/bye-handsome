import type { InventoryResult, ProjectProfile } from "../agent/types.js";
import { scanReactInventory } from "../scanners/reactScanner.js";
import { scanVueInventory } from "../scanners/vueScanner.js";

export async function sourceInventorySkill(profile: ProjectProfile): Promise<InventoryResult> {
  if (profile.stack === "vue2" || profile.stack === "vue3") {
    return scanVueInventory(profile.root);
  }

  if (profile.stack === "react" || profile.stack === "umi") {
    return scanReactInventory(profile.root);
  }

  return {
    pages: [],
    components: [],
    apis: [],
    routes: [],
    requestWrappers: [],
    pageApiRelations: [],
    confirmationItems: ["未知技术栈，未执行页面/组件/API 扫描"]
  };
}
