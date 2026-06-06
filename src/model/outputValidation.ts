const fallbackMarker = "确定性 fallback 输出";

const forbiddenMarkdownPatterns = [
  /diff --git/i,
  /apply this patch/i,
  /生成业务源码\s*patch/i,
  /修改被扫描项目源码/i
];

export function validateMarkdownSections(text: string, requiredHeadings: string[]): void {
  const missing = requiredHeadings.filter((heading) => !text.includes(heading));
  if (missing.length > 0) {
    throw new Error(
      `Model Markdown validation failed: missing required headings: ${missing.join(", ")}`
    );
  }
}

export function assertNoBusinessPatchContent(text: string): void {
  const matched = forbiddenMarkdownPatterns.find((pattern) => pattern.test(text));
  if (matched) {
    throw new Error(`Model Markdown validation failed: forbidden patch content: ${matched}`);
  }
}

export function assertFallbackMarker(text: string): void {
  if (!text.includes(fallbackMarker)) {
    throw new Error(`Model Markdown validation failed: missing fallback marker: ${fallbackMarker}`);
  }
}

export function withFallbackMarker(markdown: string): string {
  return `${markdown.trimEnd()}

## 生成方式

- ${fallbackMarker}
`;
}
