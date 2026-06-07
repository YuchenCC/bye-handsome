import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import type { FrontendStack, ProjectProfile } from "../agent/types.js";

interface PackageJson {
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

const uiFrameworkNames = ["antd", "element-ui", "element-plus", "vant", "jupui"] as const;

export async function scanProjectProfile(root: string): Promise<ProjectProfile> {
  const packageJson = await readPackageJson(root);
  const deps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies
  };
  const depNames = Object.keys(deps);
  const stackResult = detectStack(deps);
  const uiFrameworks = depNames.filter((name) =>
    uiFrameworkNames.includes(name as (typeof uiFrameworkNames)[number])
  );

  return {
    root,
    stack: stackResult.stack,
    stackEvidence: stackResult.evidence,
    buildTool: detectBuildTool(depNames),
    uiFrameworks,
    requestLayer: detectRequestLayer(depNames),
    routeStyle: detectRouteStyle(depNames),
    styleSystem: detectStyleSystem(depNames),
    qualityConfig: detectQualityConfig(depNames),
    commands: packageJson.scripts ?? {},
    packageManager: await detectPackageManager(root),
    sourceDirs: await detectSourceDirs(root),
    confirmationItems:
      stackResult.stack === "unknown" ? ["Unable to identify frontend stack"] : []
  };
}

async function readPackageJson(root: string): Promise<PackageJson> {
  const packageJsonPath = join(root, "package.json");
  return JSON.parse(await readFile(packageJsonPath, "utf8")) as PackageJson;
}

function detectStack(deps: Record<string, string>): { stack: FrontendStack; evidence: string[] } {
  if ("jupui" in deps) {
    return { stack: "vue2", evidence: ["dependency:jupui"] };
  }

  if ("umi" in deps) {
    return { stack: "umi", evidence: ["dependency:umi"] };
  }

  if ("@umijs/max" in deps) {
    return { stack: "umi", evidence: ["dependency:@umijs/max"] };
  }

  if ("vue" in deps) {
    const version = deps.vue ?? "";
    return {
      stack: version.includes("2.") ? "vue2" : "vue3",
      evidence: [`dependency:vue@${version}`]
    };
  }

  if ("react" in deps) {
    return { stack: "react", evidence: ["dependency:react"] };
  }

  return { stack: "unknown", evidence: [] };
}

function detectBuildTool(depNames: string[]): string | undefined {
  if (depNames.includes("vite")) return "vite";
  if (depNames.includes("webpack")) return "webpack";
  if (depNames.includes("@vue/cli-service")) return "vue-cli";
  if (depNames.includes("umi") || depNames.includes("@umijs/max")) return "umi";
  return undefined;
}

function detectRequestLayer(depNames: string[]): string | undefined {
  if (depNames.includes("axios")) return "axios";
  if (depNames.includes("umi-request")) return "umi-request";
  if (depNames.includes("@umijs/request")) return "@umijs/request";
  if (depNames.includes("whatwg-fetch") || depNames.includes("isomorphic-fetch")) return "fetch";
  return undefined;
}

function detectRouteStyle(depNames: string[]): string | undefined {
  if (depNames.includes("vue-router")) return "vue-router";
  if (depNames.includes("react-router") || depNames.includes("react-router-dom")) {
    return "react-router";
  }
  if (depNames.includes("umi") || depNames.includes("@umijs/max")) return "umi";
  return undefined;
}

function detectStyleSystem(depNames: string[]): string | undefined {
  if (depNames.includes("tailwindcss")) return "tailwindcss";
  if (depNames.includes("unocss")) return "unocss";
  if (depNames.includes("sass") || depNames.includes("node-sass")) return "sass";
  if (depNames.includes("less")) return "less";
  if (depNames.includes("styled-components")) return "styled-components";
  if (depNames.some((name) => name.includes("css-loader"))) return "css-modules";
  return undefined;
}

function detectQualityConfig(depNames: string[]): string[] {
  return depNames.filter((name) =>
    ["eslint", "prettier", "stylelint", "typescript", "vuex", "pinia", "redux", "@reduxjs/toolkit"].includes(name)
  );
}

async function detectPackageManager(root: string): Promise<string> {
  if (await fileExists(join(root, "pnpm-lock.yaml"))) return "pnpm";
  if (await fileExists(join(root, "yarn.lock"))) return "yarn";
  if (await fileExists(join(root, "package-lock.json"))) return "npm";
  return "npm";
}

async function detectSourceDirs(root: string): Promise<string[]> {
  const candidates = ["src", "packages", "app"];
  const existing = [];
  for (const candidate of candidates) {
    try {
      if ((await stat(join(root, candidate))).isDirectory()) {
        existing.push(candidate);
      }
    } catch {
      // Ignore missing conventional source directories.
    }
  }

  if (existing.length > 0) return existing;
  try {
    const entries = await readdir(root, { withFileTypes: true });
    const firstSourceLike = entries.find((entry) => entry.isDirectory() && !entry.name.startsWith("."));
    return firstSourceLike ? [firstSourceLike.name] : ["src"];
  } catch {
    return ["src"];
  }
}

async function fileExists(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}
