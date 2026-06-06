#!/usr/bin/env node
import { Command } from "commander";
import { runGovernanceAgent } from "../agent/governanceAgent.js";

const program = new Command();

program
  .name("ai-context-governance")
  .description("Generate AI Coding context documents for legacy frontend projects")
  .requiredOption("-i, --input <path>", "source zip or local project directory")
  .option("-o, --output <path>", "output directory", "ai-context-package")
  .option("--model-provider <provider>", "configured model provider")
  .option("--model <model>", "configured model name")
  .option("--base-url <url>", "configured model API base URL")
  .option("--api-key <key>", "configured model API key")
  .option("--current-session-model", "use current interactive session model mode")
  .action(async (options) => {
    await runGovernanceAgent({
      inputPath: options.input,
      outputPath: options.output,
      model: {
        provider: options.modelProvider,
        model: options.model,
        baseUrl: options.baseUrl,
        apiKey: options.apiKey,
        useCurrentSession: Boolean(options.currentSessionModel)
      }
    });
  });

await program.parseAsync();
