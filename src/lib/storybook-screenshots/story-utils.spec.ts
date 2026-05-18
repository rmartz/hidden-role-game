import { describe, expect, it } from "vitest";

import {
  exportNameToStoryId,
  extractStoryExportNames,
  extractTitleFromContent,
  filePathToAutoTitle,
  generateScreenshotsConfig,
  titleToComponentId,
} from "./story-utils";

describe("filePathToAutoTitle", () => {
  it("capitalizes directory segments and strips .stories.tsx", () => {
    expect(filePathToAutoTitle("src/components/HomeLink.stories.tsx")).toBe(
      "Components/HomeLink",
    );
  });

  it("handles nested paths", () => {
    expect(
      filePathToAutoTitle("src/components/lobby/ExpandedRoleList.stories.tsx"),
    ).toBe("Components/Lobby/ExpandedRoleList");
  });

  it("handles app directory", () => {
    expect(filePathToAutoTitle("src/app/HomePageView.stories.tsx")).toBe(
      "App/HomePageView",
    );
  });

  it("works without src/ prefix", () => {
    expect(filePathToAutoTitle("components/HomeLink.stories.tsx")).toBe(
      "Components/HomeLink",
    );
  });

  it("handles .stories.ts extension", () => {
    expect(filePathToAutoTitle("src/components/Foo.stories.ts")).toBe(
      "Components/Foo",
    );
  });
});

describe("titleToComponentId", () => {
  it("lowercases and replaces slashes with hyphens", () => {
    expect(titleToComponentId("Components/HomeLink")).toBe(
      "components-homelink",
    );
  });

  it("handles deeply nested title", () => {
    expect(titleToComponentId("Components/Lobby/ExpandedRoleList")).toBe(
      "components-lobby-expandedrolelist",
    );
  });

  it("handles a simple single-segment title", () => {
    expect(titleToComponentId("HomeLink")).toBe("homelink");
  });
});

describe("exportNameToStoryId", () => {
  it("lowercases a simple single-word name", () => {
    expect(exportNameToStoryId("Default")).toBe("default");
  });

  it("converts PascalCase to kebab-case", () => {
    expect(exportNameToStoryId("FlatNoSearch")).toBe("flat-no-search");
  });

  it("converts two-word PascalCase", () => {
    expect(exportNameToStoryId("ActiveSearch")).toBe("active-search");
  });

  it("converts multi-word PascalCase", () => {
    expect(exportNameToStoryId("ActiveLobbyWithGame")).toBe(
      "active-lobby-with-game",
    );
  });

  it("converts ErrorState", () => {
    expect(exportNameToStoryId("ErrorState")).toBe("error-state");
  });
});

describe("extractTitleFromContent", () => {
  it("returns the title when present with double quotes", () => {
    const content = `const meta = { title: "Custom/Title", component: Foo } satisfies Meta<typeof Foo>;`;
    expect(extractTitleFromContent(content)).toBe("Custom/Title");
  });

  it("returns the title when present with single quotes", () => {
    const content = `const meta = { title: 'Lobby/Panel', component: Foo };`;
    expect(extractTitleFromContent(content)).toBe("Lobby/Panel");
  });

  it("returns undefined when no title is set", () => {
    const content = `const meta = { component: HomeLink } satisfies Meta<typeof HomeLink>;`;
    expect(extractTitleFromContent(content)).toBeUndefined();
  });

  it("ignores title in story args (only reads meta block)", () => {
    const content = `
const meta = { component: RoleGlossaryDialog } satisfies Meta<typeof RoleGlossaryDialog>;
export default meta;
export const Default: Story = { args: { title: "Role Glossary" } };
    `;
    expect(extractTitleFromContent(content)).toBeUndefined();
  });
});

describe("extractStoryExportNames", () => {
  it("extracts capitalized named exports", () => {
    const content = `
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const FlatNoSearch: Story = { args: {} };
    `;
    expect(extractStoryExportNames(content)).toEqual([
      "Default",
      "FlatNoSearch",
    ]);
  });

  it("excludes the default export", () => {
    const content = `export default meta;`;
    expect(extractStoryExportNames(content)).toEqual([]);
  });

  it("excludes lowercase exports", () => {
    const content = `
const meta = {};
export default meta;
export const Default: Story = {};
    `;
    expect(extractStoryExportNames(content)).toEqual(["Default"]);
  });

  it("returns empty array when no stories", () => {
    const content = `export default meta;`;
    expect(extractStoryExportNames(content)).toEqual([]);
  });
});

describe("generateScreenshotsConfig", () => {
  it("generates YAML with a single story URL", () => {
    const files = [
      {
        path: "src/components/HomeLink.stories.tsx",
        content: `
const meta = { component: HomeLink } satisfies Meta<typeof HomeLink>;
export default meta;
export const Default: Story = {};
        `,
      },
    ];
    const result = generateScreenshotsConfig(files, "http://localhost:6006");
    expect(result).toContain(
      "http://localhost:6006/?path=/story/components-homelink--default",
    );
  });

  it("generates entries for multiple stories in one file", () => {
    const files = [
      {
        path: "src/components/lobby/ExpandedRoleList.stories.tsx",
        content: `
const meta = { component: ExpandedRoleList };
export default meta;
export const FlatNoSearch: Story = {};
export const ActiveSearch: Story = {};
        `,
      },
    ];
    const result = generateScreenshotsConfig(files, "http://localhost:6006");
    expect(result).toContain(
      "components-lobby-expandedrolelist--flat-no-search",
    );
    expect(result).toContain(
      "components-lobby-expandedrolelist--active-search",
    );
  });

  it("uses explicit title over auto-title when present", () => {
    const files = [
      {
        path: "src/components/HomeLink.stories.tsx",
        content: `
const meta = { title: "Custom/Title", component: HomeLink };
export default meta;
export const Default: Story = {};
        `,
      },
    ];
    const result = generateScreenshotsConfig(files, "http://localhost:6006");
    expect(result).toContain("custom-title--default");
    expect(result).not.toContain("components-homelink");
  });

  it("returns empty screenshots list when no files", () => {
    const result = generateScreenshotsConfig([], "http://localhost:6006");
    expect(result).toContain("screenshots: []");
  });

  it("returns empty screenshots list when files have no story exports", () => {
    const files = [
      {
        path: "src/components/HomeLink.stories.tsx",
        content: `export default meta;`,
      },
    ];
    const result = generateScreenshotsConfig(files, "http://localhost:6006");
    expect(result).toContain("screenshots: []");
  });
});
