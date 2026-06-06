import type { ZodSchema } from "zod";

export function parseModelJson<T>(text: string, schema: ZodSchema<T>): T {
  const parsed = JSON.parse(text);
  return schema.parse(parsed);
}
