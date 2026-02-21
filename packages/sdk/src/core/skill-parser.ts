import type { ParsedSkill, ParsedSkillsDocument } from "./types.js";

/**
 * Parse YAML frontmatter from the beginning of a markdown document.
 */
function parseFrontmatter(markdown: string): {
  frontmatter: { name: string; description: string };
  body: string;
} {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    return {
      frontmatter: { name: "supyagent-skills", description: "" },
      body: markdown,
    };
  }

  const [, yamlBlock, body] = match;
  const fields: Record<string, string> = {};
  for (const line of yamlBlock!.split("\n")) {
    const colonIndex = line.indexOf(":");
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      const value = line.slice(colonIndex + 1).trim();
      fields[key] = value;
    }
  }

  return {
    frontmatter: {
      name: fields.name || "supyagent-skills",
      description: fields.description || "",
    },
    body: body!,
  };
}

/**
 * Extract the skill name from a section starting with `# Name`.
 */
function extractSkillName(section: string): string {
  const match = section.match(/^#\s+(.+)/m);
  return match ? match[1].trim() : "Unknown";
}

/**
 * Parse the aggregated skills markdown into structured sections.
 */
export function parseSkillsMarkdown(markdown: string): ParsedSkillsDocument {
  const { frontmatter, body } = parseFrontmatter(markdown);

  // Split body on \n---\n (the section separator)
  const parts = body.split(/\n---\n/);

  // First part is the preamble (general header info)
  const preamble = (parts[0] || "").trim();

  // Remaining parts are individual skill sections
  const skills: ParsedSkill[] = [];
  for (let i = 1; i < parts.length; i++) {
    const content = parts[i]!.trim();
    if (!content) continue;
    const name = extractSkillName(content);
    skills.push({ name, content });
  }

  return { frontmatter, preamble, skills };
}

/**
 * Build a concise system prompt from parsed skills.
 * Lists available skills with one-line summaries, not full docs.
 */
export function buildSkillsSystemPrompt(
  doc: ParsedSkillsDocument,
): string {
  if (doc.skills.length === 0) {
    return "No skills are currently available. The user has no connected integrations.";
  }

  const skillList = doc.skills.map((s) => `- **${s.name}**`).join("\n");

  return `You have access to the following skills via Supyagent:

${skillList}

To use a skill:
1. Call \`loadSkill\` with the skill name to get detailed API documentation
2. Call \`apiCall\` to make authenticated HTTP requests to the API endpoints described in the skill docs

Available skill names: ${doc.skills.map((s) => s.name).join(", ")}`;
}

/**
 * Find a skill by name (case-insensitive).
 */
export function findSkill(
  skills: ParsedSkill[],
  name: string,
): ParsedSkill | null {
  const normalized = name.toLowerCase().trim();
  return (
    skills.find((s) => s.name.toLowerCase() === normalized) ??
    skills.find((s) => s.name.toLowerCase().includes(normalized)) ??
    null
  );
}
