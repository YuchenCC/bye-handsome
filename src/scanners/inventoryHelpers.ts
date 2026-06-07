import { basename, extname, relative, sep } from "node:path";
import type {
  GovernanceUnresolvedItem,
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

export function toApiFromContent(root: string, filePath: string, content: string): InventoryApi {
  const facts = extractApiFacts(content)[0];
  return {
    name: nameFromPath(filePath),
    filePath: toRelativePath(root, filePath),
    method: facts?.method,
    path: facts?.path
  };
}

export function toRoute(root: string, filePath: string): InventoryRoute {
  return {
    name: nameFromPath(filePath),
    routePath: "待确认",
    filePath: toRelativePath(root, filePath)
  };
}

export function toRouteFromContent(root: string, filePath: string, content: string): InventoryRoute {
  const [routePath] = extractRoutePaths(content);
  return {
    name: nameFromPath(filePath),
    routePath: routePath ?? "待确认",
    filePath: toRelativePath(root, filePath)
  };
}

export function toComponentFromContent(
  root: string,
  filePath: string,
  content: string
): InventoryComponent {
  return {
    name: nameFromPath(filePath),
    filePath: toRelativePath(root, filePath),
    usage: "用途待确认",
    props: extractComponentProps(content)
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
  apis: InventoryApi[],
  pageContents: Record<string, string> = {}
): InventoryPageApiRelation[] {
  return pages.flatMap((page) => {
    const pageName = page.name.toLowerCase();
    const content = pageContents[page.filePath] ?? "";
    const importMatches = apis
      .filter((api) => content.includes(api.filePath) || content.includes(api.name))
      .map((api) => ({
        pageFilePath: page.filePath,
        apiFilePath: api.filePath,
        confidence: "import-reference" as const,
        evidence: `page content references ${api.name}`
      }));
    const matchedImportPaths = new Set(importMatches.map((relation) => relation.apiFilePath));
    const nameMatches = apis
      .filter((api) => !matchedImportPaths.has(api.filePath) && pageName.includes(api.name.toLowerCase()))
      .map((api) => ({
        pageFilePath: page.filePath,
        apiFilePath: api.filePath,
        confidence: "name-match" as const,
        evidence: `page name ${page.name} contains API name ${api.name}`
      }));
    return [...importMatches, ...nameMatches];
  });
}

export function extractRoutePaths(content: string): string[] {
  return uniqueSorted([
    ...[...content.matchAll(/path\s*:\s*["'`]([^"'`]+)["'`]/g)].map((match) => match[1]),
    ...[...content.matchAll(/<Route[^>]+path=["'`]([^"'`]+)["'`]/g)].map((match) => match[1])
  ]);
}

export function extractApiFacts(content: string): Array<{ method?: string; path?: string }> {
  const methodFacts = ["get", "post", "put", "patch", "delete"].flatMap((method) =>
    [...content.matchAll(new RegExp(`\\.${method}\\s*\\(\\s*["'\`]([^"'\`]+)["'\`]`, "g"))].map(
      (match) => ({ method, path: match[1] })
    )
  );
  const fetchFacts = [...content.matchAll(/fetch\s*\(\s*["'`]([^"'`]+)["'`]/g)].map((match) => ({
    method: "get",
    path: match[1]
  }));
  return [...methodFacts, ...fetchFacts];
}

export function extractComponentProps(content: string): string[] {
  const props = new Set<string>();
  for (const match of content.matchAll(/props\s*:\s*\{([\s\S]*?)\}/g)) {
    for (const prop of match[1].matchAll(/([A-Za-z_$][\w$]*)\s*:/g)) {
      props.add(prop[1]);
    }
  }
  for (const match of content.matchAll(/defineProps\s*<\s*\{([\s\S]*?)\}\s*>\s*\(/g)) {
    for (const prop of match[1].matchAll(/([A-Za-z_$][\w$]*)\??\s*:/g)) {
      props.add(prop[1]);
    }
  }
  for (const match of content.matchAll(/type\s+\w*Props\s*=\s*\{([\s\S]*?)\}/g)) {
    for (const prop of match[1].matchAll(/([A-Za-z_$][\w$]*)\??\s*:/g)) {
      props.add(prop[1]);
    }
  }
  return [...props].sort((left, right) => left.localeCompare(right));
}

export function unresolvedItem(
  category: GovernanceUnresolvedItem["category"],
  message: string,
  filePath?: string,
  source = "inventory",
  severity: GovernanceUnresolvedItem["severity"] = "warning"
): GovernanceUnresolvedItem {
  return { source, category, message, filePath, severity };
}
