import type { InventoryResult, ProjectProfile, TemplateExampleResult } from "../agent/types.js";
import { writePackageJson } from "../generators/packageWriter.js";

export const DEFAULT_SNIPPET_LIMITS = {
  maxFiles: 20,
  maxLinesPerFile: 80,
  maxTotalBytes: 80_000
} as const;

export interface EvidencePackageInput {
  profile: ProjectProfile;
  inventory: InventoryResult;
  templates: TemplateExampleResult;
}

export interface EvidenceUnresolvedItem {
  source: "project-profile" | "inventory" | "templates";
  message: string;
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
      ...profile.confirmationItems.map((message) => ({
        source: "project-profile" as const,
        message
      })),
      ...inventory.confirmationItems.map((message) => ({
        source: "inventory" as const,
        message
      })),
      ...templates.confirmationItems.map((message) => ({
        source: "templates" as const,
        message
      }))
    ]
  };
}

export async function writeEvidencePackage(
  outputPath: string,
  evidence: EvidencePackage
): Promise<void> {
  await Promise.all([
    writePackageJson(outputPath, ".evidence/project-profile.json", evidence.projectProfile),
    writePackageJson(outputPath, ".evidence/file-tree.json", evidence.fileTree),
    writePackageJson(outputPath, ".evidence/candidates/pages.json", evidence.candidates.pages),
    writePackageJson(
      outputPath,
      ".evidence/candidates/components.json",
      evidence.candidates.components
    ),
    writePackageJson(outputPath, ".evidence/candidates/apis.json", evidence.candidates.apis),
    writePackageJson(outputPath, ".evidence/candidates/routes.json", evidence.candidates.routes),
    writePackageJson(
      outputPath,
      ".evidence/candidates/request-wrappers.json",
      evidence.candidates.requestWrappers
    ),
    writePackageJson(outputPath, ".evidence/snippets.json", evidence.snippets),
    writePackageJson(outputPath, ".evidence/unresolved-items.json", evidence.unresolvedItems)
  ]);
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}
