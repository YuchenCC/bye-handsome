import fg from "fast-glob";
import type { InventoryResult } from "../agent/types.js";
import {
  inferPageApiRelations,
  toApi,
  toComponent,
  toPage,
  toRequestWrapper,
  toRoute,
  uniqueSorted
} from "./inventoryHelpers.js";

export async function scanReactInventory(root: string): Promise<InventoryResult> {
  const [pagePaths, componentPaths, apiPaths, routePaths, requestWrapperPaths] = await Promise.all([
    fg(["src/pages/**/*.{jsx,tsx,js,ts}"], { cwd: root, absolute: true, onlyFiles: true }),
    fg(["src/components/**/*.{jsx,tsx,js,ts}", "src/**/components/**/*.{jsx,tsx,js,ts}"], {
      cwd: root,
      absolute: true,
      onlyFiles: true
    }),
    fg(["src/api/**/*.{js,ts}", "src/services/**/*.{js,ts}"], {
      cwd: root,
      absolute: true,
      onlyFiles: true
    }),
    fg(["config/routes.{js,ts}", "src/routes/**/*.{js,ts}"], {
      cwd: root,
      absolute: true,
      onlyFiles: true
    }),
    fg(["src/request.{js,ts}", "src/utils/request.{js,ts}", "src/**/request.{js,ts}"], {
      cwd: root,
      absolute: true,
      onlyFiles: true
    })
  ]);
  const pages = uniqueSorted(pagePaths).map((filePath) => toPage(root, filePath));
  const apis = uniqueSorted(apiPaths).map((filePath) => toApi(root, filePath));

  return {
    pages,
    components: uniqueSorted(componentPaths).map((filePath) => toComponent(root, filePath)),
    apis,
    routes: uniqueSorted(routePaths).map((filePath) => toRoute(root, filePath)),
    requestWrappers: uniqueSorted(requestWrapperPaths).map((filePath) =>
      toRequestWrapper(root, filePath)
    ),
    pageApiRelations: inferPageApiRelations(pages, apis),
    confirmationItems: routePaths.length === 0 ? ["未识别到 React/Umi 路由配置文件"] : []
  };
}
