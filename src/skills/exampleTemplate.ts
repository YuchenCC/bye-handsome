import type { InventoryResult, TemplateExampleResult } from "../agent/types.js";

export async function exampleTemplateSkill(
  inventory: InventoryResult
): Promise<TemplateExampleResult> {
  const examples = [
    ...inventory.pages.slice(0, 3).map((page) => ({
      kind: "page",
      title: page.name,
      filePath: page.filePath,
      notes: `页面示例，类型：${page.pageType ?? "待确认"}`
    })),
    ...inventory.components.slice(0, 3).map((component) => ({
      kind: "component",
      title: component.name,
      filePath: component.filePath,
      notes: component.usage ?? "组件用途待确认"
    })),
    ...inventory.apis.slice(0, 3).map((api) => ({
      kind: "api",
      title: api.name,
      filePath: api.filePath,
      notes: `接口示例，方法：${api.method ?? "待确认"}`
    }))
  ];

  return {
    examples,
    confirmationItems: examples.length === 0 ? ["未找到可用模板示例"] : []
  };
}
