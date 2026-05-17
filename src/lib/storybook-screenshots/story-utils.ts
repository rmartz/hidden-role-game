/** Derives a Storybook auto-title from a stories file path.
 *
 * Mirrors the Storybook 7+ auto-title convention: each path segment (relative
 * to src/) has its first letter capitalised, then the segments are joined with
 * "/".  The ".stories.tsx/.ts" extension is stripped.
 *
 * e.g. "src/components/lobby/ExpandedRoleList.stories.tsx"
 *      → "Components/Lobby/ExpandedRoleList"
 */
export function filePathToAutoTitle(filePath: string): string {
  const withoutSrc = filePath.startsWith("src/") ? filePath.slice(4) : filePath;
  const withoutExt = withoutSrc.replace(/\.stories\.[tj]sx?$/, "");
  return withoutExt
    .split("/")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join("/");
}

/** Converts a Storybook title string to a sanitised component ID.
 *
 * e.g. "Components/Lobby/ExpandedRoleList" → "components-lobby-expandedrolelist"
 */
export function titleToComponentId(title: string): string {
  return sanitize(title.replace(/\//g, "-"));
}

/** Converts a PascalCase story export name to a kebab-case story ID.
 *
 * Mirrors Storybook's own `startCase` → sanitise pipeline:
 * "FlatNoSearch" → "Flat No Search" → "flat-no-search"
 */
export function exportNameToStoryId(exportName: string): string {
  const withSpaces = exportName.replace(/([a-z])([A-Z])/g, "$1 $2");
  return sanitize(withSpaces);
}

/** Extracts the explicit `title` value from a story file's source, or
 *  returns `undefined` when no title is set (auto-title mode). */
export function extractTitleFromContent(content: string): string | undefined {
  const match = /title:\s*["']([^"']+)["']/.exec(content);
  return match?.[1];
}

/** Returns the names of all named story exports from a story file's source.
 *
 * Only capitalised exports are included (story names are PascalCase by
 * convention); `default` and lowercase utility exports are excluded.
 */
export function extractStoryExportNames(content: string): string[] {
  const matches = [...content.matchAll(/^export const ([A-Z]\w+)/gm)];
  return matches
    .map((m) => m[1])
    .filter((name): name is string => name !== undefined);
}

/** Generates a `screenshots.config.yml` string for `auto-pr-screenshots-action`.
 *
 * Each story in each file becomes one entry with a Storybook `?path=/story/…`
 * URL.  If no stories are found the output is `screenshots: []`.
 */
export function generateScreenshotsConfig(
  files: { path: string; content: string }[],
  baseUrl: string,
): string {
  const entries: { name: string; url: string }[] = [];

  for (const file of files) {
    const title =
      extractTitleFromContent(file.content) ?? filePathToAutoTitle(file.path);
    const componentId = titleToComponentId(title);
    const storyNames = extractStoryExportNames(file.content);

    for (const storyName of storyNames) {
      const storyId = exportNameToStoryId(storyName);
      entries.push({
        name: `${title} - ${storyName}`,
        url: `${baseUrl}/?path=/story/${componentId}--${storyId}`,
      });
    }
  }

  if (entries.length === 0) {
    return "screenshots: []\n";
  }

  const lines = ["screenshots:"];
  for (const entry of entries) {
    lines.push(`  - name: "${entry.name}"`);
    lines.push(`    url: "${entry.url}"`);
  }
  return lines.join("\n") + "\n";
}

function sanitize(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}
