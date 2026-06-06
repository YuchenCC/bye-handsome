import { basename, extname, relative, sep } from "node:path";
import type {
  InventoryApi,
  InventoryComponent,
  InventoryPage,
  InventoryPageApiRelation,
  InventoryRequestWrapper,
  InventoryRoute
} from "../agent/types.js";

export function toRelativePath(root: string, filePath: string): string {
  return relative(root, filePath).split(sep).join("/");
}

export function nameFromPath(filePath: string): string {
  return basename(filePath, extname(filePath));
}

export function uniqueSorted(paths: string[]): string[] {
  return [...new Set(paths)].sort((left, right) => left.localeCompare(right));
}

export function toPage(root: string, filePath: string): InventoryPage {
  const relativePath = toRelativePath(root, filePath);
  return {
    name: nameFromPath(filePath),
    filePath: relativePath,
    pageType: relativePath.includes("/pages/") ? "page" : "view"
  };
}

export function toComponent(root: string, filePath: string): InventoryComponent {
  return {
    name: nameFromPath(filePath),
    filePath: toRelativePath(root, filePath),
    usage: "用途待确认",
    props: []
  };
}

export function toApi(root: string, filePath: string): InventoryApi {
  return {
    name: nameFromPath(filePath),
    filePath: toRelativePath(root, filePath)
  };
}

export function toRoute(root: string, filePath: string): InventoryRoute {
  return {
    name: nameFromPath(filePath),
    routePath: "待确认",
    filePath: toRelativePath(root, filePath)
  };
}

export function toRequestWrapper(root: string, filePath: string): InventoryRequestWrapper {
  return {
    name: nameFromPath(filePath),
    filePath: toRelativePath(root, filePath)
  };
}

export function inferPageApiRelations(
  pages: InventoryPage[],
  apis: InventoryApi[]
): InventoryPageApiRelation[] {
  return pages.flatMap((page) => {
    const pageName = page.name.toLowerCase();
    return apis
      .filter((api) => pageName.includes(api.name.toLowerCase()))
      .map((api) => ({
        pageFilePath: page.filePath,
        apiFilePath: api.filePath,
        confidence: "name-match" as const
      }));
  });
}
