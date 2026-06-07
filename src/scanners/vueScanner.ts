import fg from "fast-glob";
import { readFile } from "node:fs/promises";
import type { InventoryResult } from "../agent/types.js";
import {
  inferPageApiRelations,
  toApiFromContent,
  toComponentFromContent,
  toPage,
  toRequestWrapper,
  toRouteFromContent,
  toRelativePath,
  unresolvedItem,
  uniqueSorted
} from "./inventoryHelpers.js";

export async function scanVueInventory(root: string): Promise<InventoryResult> {
  const [pagePaths, componentPaths, apiPaths, routePaths, requestWrapperPaths] = await Promise.all([
    fg(["src/pages/**/*.vue", "src/views/**/*.vue"], { cwd: root, absolute: true, onlyFiles: true }),
    fg(["src/components/**/*.vue", "src/**/components/**/*.vue"], {
      cwd: root,
      absolute: true,
      onlyFiles: true
    }),
    fg(["src/api/**/*.{js,ts}", "src/services/**/*.{js,ts}"], {
      cwd: root,
      absolute: true,
      onlyFiles: true
    }),
    fg(["src/router/**/*.{js,ts}"], { cwd: root, absolute: true, onlyFiles: true }),
    fg(["src/request.{js,ts}", "src/utils/request.{js,ts}", "src/**/request.{js,ts}"], {
      cwd: root,
      absolute: true,
      onlyFiles: true
    })
  ]);
  const pages = uniqueSorted(pagePaths).map((filePath) => toPage(root, filePath));
  const pageContents = await readContents(root, pagePaths);
  const apis = await Promise.all(
    uniqueSorted(apiPaths).map(async (filePath) =>
      toApiFromContent(root, filePath, await readFile(filePath, "utf8"))
    )
  );
  const components = await Promise.all(
    uniqueSorted(componentPaths).map(async (filePath) =>
      toComponentFromContent(root, filePath, await readFile(filePath, "utf8"))
    )
  );
  const routes = await Promise.all(
    uniqueSorted(routePaths).map(async (filePath) =>
      toRouteFromContent(root, filePath, await readFile(filePath, "utf8"))
    )
  );
  const unresolvedItems = [
    ...(routePaths.length === 0
      ? [unresolvedItem("route", "未识别到 Vue 路由配置文件")]
      : routes
          .filter((route) => route.routePath === "待确认")
          .map((route) => unresolvedItem("route", "路由路径待确认", route.filePath))),
    ...(requestWrapperPaths.length === 0
      ? [unresolvedItem("request-wrapper", "未识别到 request wrapper")]
      : []),
    ...apis
      .filter((api) => !api.method || !api.path)
      .map((api) => unresolvedItem("api-contract", "接口方法或路径待确认", api.filePath)),
    ...components
      .filter((component) => component.props.length === 0)
      .map((component) => unresolvedItem("component-props", "组件 props 待确认", component.filePath)),
    unresolvedItem("permission", "权限规则待确认", undefined, "inventory", "info"),
    unresolvedItem("dictionary", "字典规则待确认", undefined, "inventory", "info")
  ];

  return {
    pages,
    components,
    apis,
    routes,
    requestWrappers: uniqueSorted(requestWrapperPaths).map((filePath) =>
      toRequestWrapper(root, filePath)
    ),
    pageApiRelations: inferPageApiRelations(pages, apis, pageContents),
    confirmationItems: unresolvedItems.map((item) => item.message),
    unresolvedItems
  };
}

async function readContents(root: string, filePaths: string[]): Promise<Record<string, string>> {
  const entries = await Promise.all(
    uniqueSorted(filePaths).map(async (filePath) => [
      toRelativePath(root, filePath),
      await readFile(filePath, "utf8")
    ] as const)
  );
  return Object.fromEntries(entries);
}
