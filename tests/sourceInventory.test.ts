import { mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { ProjectProfile } from "../src/agent/types.js";
import { exampleTemplateSkill } from "../src/skills/exampleTemplate.js";
import { sourceInventorySkill } from "../src/skills/sourceInventory.js";

const testRoots: string[] = [];

async function createFile(root: string, relativePath: string, content = ""): Promise<void> {
  const filePath = join(root, relativePath);
  await mkdir(join(filePath, ".."), { recursive: true });
  await writeFile(filePath, content, "utf8");
}

async function createRoot(): Promise<string> {
  const root = join(tmpdir(), `source-inventory-test-${Date.now()}-${testRoots.length}`);
  testRoots.push(root);
  await mkdir(root, { recursive: true });
  return root;
}

function profile(root: string, stack: ProjectProfile["stack"]): ProjectProfile {
  return {
    root,
    stack,
    stackEvidence: [`test:${stack}`],
    uiFrameworks: [],
    qualityConfig: [],
    commands: {},
    sourceDirs: ["src"],
    confirmationItems: []
  };
}

describe("sourceInventorySkill", () => {
  afterEach(async () => {
    await Promise.all(
      testRoots.splice(0).map((root) => rm(root, { recursive: true, force: true }))
    );
  });

  it("scans Vue pages, components, APIs, and routes", async () => {
    const root = await createRoot();
    await createFile(root, "src/pages/UserList.vue", "<template />");
    await createFile(root, "src/components/UserTable.vue", "<script>export default { props: { value: String } }</script>");
    await createFile(root, "src/api/user.ts", "export const listUsers = () => request.get('/users');");
    await createFile(root, "src/utils/request.ts", "export const request = {};");
    await createFile(root, "src/router/index.ts", "export default [{ path: '/users' }];");

    const inventory = await sourceInventorySkill(profile(root, "vue2"));

    expect(inventory.pages).toEqual([
      expect.objectContaining({ name: "UserList", filePath: "src/pages/UserList.vue" })
    ]);
    expect(inventory.components).toEqual([
      expect.objectContaining({ name: "UserTable", filePath: "src/components/UserTable.vue" })
    ]);
    expect(inventory.apis).toEqual([
      expect.objectContaining({ name: "user", filePath: "src/api/user.ts", method: "get", path: "/users" })
    ]);
    expect(inventory.routes).toEqual([
      expect.objectContaining({ name: "index", filePath: "src/router/index.ts", routePath: "/users" })
    ]);
    expect(inventory.requestWrappers).toEqual([
      expect.objectContaining({ name: "request", filePath: "src/utils/request.ts" })
    ]);
    expect(inventory.pageApiRelations).toEqual([
      expect.objectContaining({
        pageFilePath: "src/pages/UserList.vue",
        apiFilePath: "src/api/user.ts",
        confidence: "name-match",
        evidence: expect.any(String)
      })
    ]);
    expect(inventory.confirmationItems).toEqual(["权限规则待确认", "字典规则待确认"]);
  });

  it("scans React and Umi source inventory with route config files", async () => {
    const root = await createRoot();
    await createFile(root, "src/pages/Dashboard.tsx", "export function Dashboard() {}");
    await createFile(
      root,
      "src/components/MetricCard.tsx",
      "type MetricCardProps = { value: string; disabled?: boolean };\nexport function MetricCard(props: MetricCardProps) { return null; }"
    );
    await createFile(root, "src/services/dashboard.ts", "export async function fetchMetrics() { return request.post('/api/dashboard'); }");
    await createFile(root, "src/request.ts", "export const request = {};");
    await createFile(root, "config/routes.ts", "export default [{ path: '/dashboard' }];");

    const inventory = await sourceInventorySkill(profile(root, "umi"));

    expect(inventory.pages).toEqual([
      expect.objectContaining({ name: "Dashboard", filePath: "src/pages/Dashboard.tsx" })
    ]);
    expect(inventory.components).toEqual([
      expect.objectContaining({
        name: "MetricCard",
        filePath: "src/components/MetricCard.tsx",
        props: expect.arrayContaining(["value", "disabled"])
      })
    ]);
    expect(inventory.apis).toEqual([
      expect.objectContaining({ name: "dashboard", filePath: "src/services/dashboard.ts", method: "post", path: "/api/dashboard" })
    ]);
    expect(inventory.routes).toEqual([
      expect.objectContaining({ name: "routes", filePath: "config/routes.ts", routePath: "/dashboard" })
    ]);
    expect(inventory.requestWrappers).toEqual([
      expect.objectContaining({ name: "request", filePath: "src/request.ts" })
    ]);
    expect(inventory.pageApiRelations).toEqual([
      {
        pageFilePath: "src/pages/Dashboard.tsx",
        apiFilePath: "src/services/dashboard.ts",
        confidence: "name-match",
        evidence: expect.any(String)
      }
    ]);
  });

  it("records categorized unresolved items for missing scan facts", async () => {
    const root = await createRoot();
    await createFile(root, "src/pages/Loose.tsx", "export function Loose() { return null; }");
    await createFile(root, "src/components/LooseCard.tsx", "export function LooseCard(props) { return null; }");
    await createFile(root, "src/services/loose.ts", "export function listLoose() { return request('/loose'); }");

    const inventory = await sourceInventorySkill(profile(root, "react"));

    expect(inventory.unresolvedItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ category: "route" }),
        expect.objectContaining({ category: "request-wrapper" }),
        expect.objectContaining({ category: "api-contract" }),
        expect.objectContaining({ category: "component-props" }),
        expect.objectContaining({ category: "permission" }),
        expect.objectContaining({ category: "dictionary" })
      ])
    );
  });

  it("extracts representative examples from inventory results", async () => {
    const root = await createRoot();
    await createFile(root, "src/pages/UserList.vue");
    await createFile(root, "src/components/UserTable.vue");
    await createFile(root, "src/api/user.ts");

    const inventory = await sourceInventorySkill(profile(root, "vue3"));
    const examples = await exampleTemplateSkill(inventory);

    expect(examples.examples).toEqual([
      expect.objectContaining({ kind: "page", title: "UserList" }),
      expect.objectContaining({ kind: "component", title: "UserTable" }),
      expect.objectContaining({ kind: "api", title: "user" })
    ]);
    expect(examples.confirmationItems).toEqual([]);
  });
});
