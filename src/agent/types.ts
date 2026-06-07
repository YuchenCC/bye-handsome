export type FrontendStack = "vue2" | "vue3" | "react" | "umi" | "unknown";

export interface GovernanceAgentOptions {
  inputPath: string;
  outputPath: string;
  model: ModelOptions;
}

export interface ModelOptions {
  provider?: string;
  model?: string;
  baseUrl?: string;
  apiKey?: string;
  useCurrentSession?: boolean;
}

export interface WorkspaceInput {
  sourcePath: string;
  workspacePath: string;
  cleanup: () => Promise<void>;
}

export interface ProjectProfile {
  root: string;
  stack: FrontendStack;
  stackEvidence: string[];
  buildTool?: string;
  uiFrameworks: string[];
  requestLayer?: string;
  routeStyle?: string;
  styleSystem?: string;
  qualityConfig: string[];
  commands: Record<string, string>;
  packageManager?: string;
  sourceDirs: string[];
  confirmationItems: string[];
}

export interface InventoryResult {
  pages: InventoryPage[];
  components: InventoryComponent[];
  apis: InventoryApi[];
  routes: InventoryRoute[];
  requestWrappers: InventoryRequestWrapper[];
  pageApiRelations: InventoryPageApiRelation[];
  confirmationItems: string[];
  unresolvedItems?: GovernanceUnresolvedItem[];
}

export interface InventoryPage {
  name: string;
  filePath: string;
  routePath?: string;
  pageType?: string;
}

export interface InventoryComponent {
  name: string;
  filePath: string;
  usage?: string;
  props: string[];
}

export interface InventoryApi {
  name: string;
  filePath: string;
  method?: string;
  path?: string;
}

export interface InventoryRoute {
  name?: string;
  routePath: string;
  filePath: string;
}

export interface InventoryRequestWrapper {
  name: string;
  filePath: string;
}

export interface InventoryPageApiRelation {
  pageFilePath: string;
  apiFilePath: string;
  confidence: "import-reference" | "name-match";
  evidence?: string;
}

export type UnresolvedCategory =
  | "project-profile"
  | "route"
  | "api-contract"
  | "component-props"
  | "request-wrapper"
  | "permission"
  | "dictionary"
  | "business-field"
  | "model-generation"
  | "schema-validation";

export interface GovernanceUnresolvedItem {
  source: string;
  category: UnresolvedCategory;
  message: string;
  filePath?: string;
  severity: "info" | "warning" | "error";
}

export interface GenerationStatusItem {
  artifact: string;
  skill: string;
  status: "model" | "fallback" | "failed";
  reason?: string;
}

export interface TemplateExampleResult {
  examples: Array<{
    kind: string;
    title: string;
    filePath: string;
    notes: string;
  }>;
  confirmationItems: string[];
}
