import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type {
  GenerationStatusItem,
  GovernanceUnresolvedItem,
  InventoryResult,
  ProjectProfile,
  TemplateExampleResult
} from "../agent/types.js";
import { writeValidatedPackageJson } from "../generators/packageWriter.js";
import {
  generationStatusSchema,
  fileTreeSchema,
  inventoryArraySchema,
  pageApiRelationsSchema,
  projectProfileSchema,
  snippetPackageSchema,
  unresolvedItemsSchema
} from "../model/packageSchemas.js";

export const DEFAULT_SNIPPET_LIMITS = {
  maxFiles: 20,
  maxLinesPerFile: 80,
  maxBytesPerFile: 8_000,
  maxTotalBytes: 80_000
} as const;

export interface EvidencePackageInput {
  profile: ProjectProfile;
  inventory: InventoryResult;
  templates: TemplateExampleResult;
}

export interface EvidenceUnresolvedItem {
  source: "project-profile" | "inventory" | "templates" | string;
  message: string;
  category?: GovernanceUnresolvedItem["category"];
  filePath?: string;
  severity?: GovernanceUnresolvedItem["severity"];
}

export interface EvidenceSnippetPackage {
  limits: typeof DEFAULT_SNIPPET_LIMITS;
  items: Array<{
    filePath: string;
    reason: string;
    content: string;
    truncated: boolean;
  }>;
}

export interface EvidencePackage {
  projectProfile: ProjectProfile;
  fileTree: {
    root: string;
    sourceDirs: string[];
    candidateFiles: string[];
  };
  candidates: {
    pages: InventoryResult["pages"];
    components: InventoryResult["components"];
    apis: InventoryResult["apis"];
    routes: InventoryResult["routes"];
    requestWrappers: InventoryResult["requestWrappers"];
    pageApiRelations: InventoryResult["pageApiRelations"];
    templates: TemplateExampleResult["examples"];
  };
  snippets: EvidenceSnippetPackage;
  unresolvedItems: EvidenceUnresolvedItem[];
  generationStatus: GenerationStatusItem[];
}

export function buildEvidencePackage({
  profile,
  inventory,
  templates
}: EvidencePackageInput): EvidencePackage {
  const candidateFiles = uniqueSorted([
    ...inventory.pages.map((item) => item.filePath),
    ...inventory.components.map((item) => item.filePath),
    ...inventory.apis.map((item) => item.filePath),
    ...inventory.routes.map((item) => item.filePath),
    ...inventory.requestWrappers.map((item) => item.filePath),
    ...templates.examples.map((item) => item.filePath)
  ]);

  return {
    projectProfile: profile,
    fileTree: {
      root: profile.root,
      sourceDirs: profile.sourceDirs,
      candidateFiles
    },
    candidates: {
      pages: inventory.pages,
      components: inventory.components,
      apis: inventory.apis,
      routes: inventory.routes,
      requestWrappers: inventory.requestWrappers,
      pageApiRelations: inventory.pageApiRelations,
      templates: templates.examples
    },
    snippets: {
      limits: DEFAULT_SNIPPET_LIMITS,
      items: candidateFiles.slice(0, DEFAULT_SNIPPET_LIMITS.maxFiles).map((filePath) => ({
        filePath,
        reason: "candidate file selected for bounded evidence",
        content: "",
        truncated: false
      }))
    },
    unresolvedItems: [
      ...profile.confirmationItems.map((message) =>
        toEvidenceUnresolvedItem({ source: "project-profile", category: "project-profile", message, severity: "warning" })
      ),
      ...(inventory.unresolvedItems ?? []).map(toEvidenceUnresolvedItem),
      ...inventory.confirmationItems
        .filter((message) => !(inventory.unresolvedItems ?? []).some((item) => item.message === message))
        .map((message) => toEvidenceUnresolvedItem({ source: "inventory", category: categorizeMessage(message), message, severity: "warning" })),
      ...templates.confirmationItems.map((message) =>
        toEvidenceUnresolvedItem({ source: "templates", category: "business-field", message, severity: "warning" })
      )
    ],
    generationStatus: []
  };
}

export async function buildEvidencePackageWithSnippets(
  input: EvidencePackageInput,
  generationStatus: GenerationStatusItem[] = []
): Promise<EvidencePackage> {
  const evidence = buildEvidencePackage(input);
  return {
    ...evidence,
    snippets: await buildSnippetPackage(input.profile.root, evidence.fileTree.candidateFiles),
    generationStatus
  };
}

async function buildSnippetPackage(
  root: string,
  candidateFiles: string[]
): Promise<EvidenceSnippetPackage> {
  const selectedFiles = uniqueSorted(candidateFiles)
    .sort((left, right) => snippetPriority(left) - snippetPriority(right) || left.localeCompare(right))
    .slice(0, DEFAULT_SNIPPET_LIMITS.maxFiles);
  const items: EvidenceSnippetPackage["items"] = [];
  let totalBytes = 0;

  for (const filePath of selectedFiles) {
    if (totalBytes >= DEFAULT_SNIPPET_LIMITS.maxTotalBytes) break;
    try {
      const absolutePath = join(root, filePath);
      const raw = await readFile(absolutePath, "utf8");
      const lines = raw.split(/\r?\n/);
      const lineLimited = lines.length > DEFAULT_SNIPPET_LIMITS.maxLinesPerFile;
      let content = lines.slice(0, DEFAULT_SNIPPET_LIMITS.maxLinesPerFile).join("\n");
      let truncated = lineLimited;
      if (Buffer.byteLength(content, "utf8") > DEFAULT_SNIPPET_LIMITS.maxBytesPerFile) {
        content = truncateUtf8(content, DEFAULT_SNIPPET_LIMITS.maxBytesPerFile);
        truncated = true;
      }
      const remainingBytes = DEFAULT_SNIPPET_LIMITS.maxTotalBytes - totalBytes;
      if (Buffer.byteLength(content, "utf8") > remainingBytes) {
        content = truncateUtf8(content, remainingBytes);
        truncated = true;
      }
      totalBytes += Buffer.byteLength(content, "utf8");
      items.push({
        filePath,
        reason: "candidate file selected for bounded evidence",
        content,
        truncated
      });
    } catch {
      items.push({
        filePath,
        reason: "candidate file selected for bounded evidence but content could not be read",
        content: "",
        truncated: false
      });
    }
  }

  return { limits: DEFAULT_SNIPPET_LIMITS, items };
}

export async function writeEvidencePackage(
  outputPath: string,
  evidence: EvidencePackage
): Promise<void> {
  await Promise.all([
    writeValidatedPackageJson(outputPath, ".evidence/project-profile.json", evidence.projectProfile, projectProfileSchema),
    writeValidatedPackageJson(outputPath, ".evidence/file-tree.json", evidence.fileTree, fileTreeSchema),
    writeValidatedPackageJson(outputPath, ".evidence/candidates/pages.json", evidence.candidates.pages, inventoryArraySchema),
    writeValidatedPackageJson(
      outputPath,
      ".evidence/candidates/components.json",
      evidence.candidates.components,
      inventoryArraySchema
    ),
    writeValidatedPackageJson(outputPath, ".evidence/candidates/apis.json", evidence.candidates.apis, inventoryArraySchema),
    writeValidatedPackageJson(outputPath, ".evidence/candidates/routes.json", evidence.candidates.routes, inventoryArraySchema),
    writeValidatedPackageJson(
      outputPath,
      ".evidence/candidates/request-wrappers.json",
      evidence.candidates.requestWrappers,
      inventoryArraySchema
    ),
    writeValidatedPackageJson(outputPath, ".evidence/snippets.json", evidence.snippets, snippetPackageSchema),
    writeValidatedPackageJson(outputPath, ".evidence/unresolved-items.json", evidence.unresolvedItems, unresolvedItemsSchema),
    writeValidatedPackageJson(outputPath, ".evidence/generation-status.json", evidence.generationStatus, generationStatusSchema),
    writeValidatedPackageJson(outputPath, ".evidence/candidates/page-api-relations.json", evidence.candidates.pageApiRelations, pageApiRelationsSchema)
  ]);
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function toEvidenceUnresolvedItem(item: GovernanceUnresolvedItem): EvidenceUnresolvedItem {
  return {
    source: item.source,
    category: item.category,
    message: item.message,
    filePath: item.filePath,
    severity: item.severity
  };
}

function categorizeMessage(message: string): GovernanceUnresolvedItem["category"] {
  if (message.includes("request")) return "request-wrapper";
  if (message.includes("路由")) return "route";
  if (message.includes("接口") || message.toLowerCase().includes("api")) return "api-contract";
  if (message.includes("props")) return "component-props";
  if (message.includes("权限")) return "permission";
  if (message.includes("字典")) return "dictionary";
  return "business-field";
}

function snippetPriority(filePath: string): number {
  if (filePath.includes("request")) return 0;
  if (filePath.includes("router") || filePath.includes("routes")) return 1;
  if (filePath.includes("/api/") || filePath.includes("/services/")) return 2;
  if (filePath.includes("/pages/") || filePath.includes("/views/")) return 3;
  if (filePath.includes("/components/")) return 4;
  return 5;
}

function truncateUtf8(text: string, maxBytes: number): string {
  if (maxBytes <= 0) return "";
  let output = "";
  let bytes = 0;
  for (const char of text) {
    const charBytes = Buffer.byteLength(char, "utf8");
    if (bytes + charBytes > maxBytes) break;
    output += char;
    bytes += charBytes;
  }
  return output;
}
