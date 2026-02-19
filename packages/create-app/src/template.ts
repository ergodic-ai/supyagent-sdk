/**
 * Replace {{variable}} placeholders in template content.
 */
export function applyTemplate(
  content: string,
  variables: Record<string, string>
): string {
  return content.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return key in variables ? variables[key] : match;
  });
}
