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
  confidence: "name-match";
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
