import { z, type ZodSchema } from "zod";

export const packageJsonObjectSchema = z.record(z.string(), z.unknown());

export const projectProfileSchema = z.object({
  root: z.string(),
  stack: z.enum(["vue2", "vue3", "react", "umi", "unknown"]),
  stackEvidence: z.array(z.string()),
  buildTool: z.string().optional(),
  uiFrameworks: z.array(z.string()),
  requestLayer: z.string().optional(),
  routeStyle: z.string().optional(),
  styleSystem: z.string().optional(),
  qualityConfig: z.array(z.string()),
  commands: z.record(z.string(), z.string()),
  packageManager: z.string().optional(),
  sourceDirs: z.array(z.string()),
  confirmationItems: z.array(z.string())
});

const namedFileSchema = z.object({
  name: z.string().optional(),
  filePath: z.string()
}).passthrough();

export const inventoryArraySchema = z.array(namedFileSchema);

export const fileTreeSchema = z.object({
  root: z.string(),
  sourceDirs: z.array(z.string()),
  candidateFiles: z.array(z.string())
});

export const pageApiRelationsSchema = z.array(
  z.object({
    pageFilePath: z.string(),
    apiFilePath: z.string(),
    confidence: z.enum(["import-reference", "name-match"]),
    evidence: z.string().optional()
  })
);

export const snippetPackageSchema = z.object({
  limits: z.object({
    maxFiles: z.number(),
    maxLinesPerFile: z.number(),
    maxBytesPerFile: z.number(),
    maxTotalBytes: z.number()
  }),
  items: z.array(
    z.object({
      filePath: z.string(),
      reason: z.string(),
      content: z.string(),
      truncated: z.boolean()
    })
  )
});

export const unresolvedItemsSchema = z.array(
  z.object({
    source: z.string(),
    message: z.string(),
    category: z.string().optional(),
    filePath: z.string().optional(),
    severity: z.enum(["info", "warning", "error"]).optional()
  })
);

export const generationStatusSchema = z.array(
  z.object({
    artifact: z.string(),
    skill: z.string(),
    status: z.enum(["model", "fallback", "failed"]),
    reason: z.string().optional()
  })
);

export function validatePackageArtifact<T>(
  name: string,
  value: unknown,
  schema: ZodSchema<T>
): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new Error(`Package artifact validation failed: ${name}: ${parsed.error.message}`);
  }
  return parsed.data;
}
