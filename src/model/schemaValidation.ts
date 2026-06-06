import { ZodError, type ZodSchema } from "zod";

export function parseModelJson<T>(text: string, schema: ZodSchema<T>): T {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new Error(`Model output validation failed: invalid JSON. ${formatError(error)}`);
  }

  try {
    return schema.parse(parsed);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(
        `Model output validation failed: schema mismatch. ${formatZodError(error)}`
      );
    }
    throw new Error(`Model output validation failed: schema mismatch. ${formatError(error)}`);
  }
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function formatZodError(error: ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "<root>";
      return `${path}: ${issue.message}`;
    })
    .join("; ");
}
