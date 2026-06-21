import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { buildTree, renderNodes, type DocumentTreeItem } from "./DocumentTree.js";

const items: DocumentTreeItem[] = [
  { identifier: "docs/guide/getting-started.md", title: "Getting Started" },
  { identifier: "docs/readme.md", title: "Readme" },
];

describe("DocumentTree", () => {
  it("shows create button only for folders and renders open/closed chevrons", () => {
    const root = buildTree(items);
    const nodes = Array.from(root.children.values()).sort((a, b) => a.name.localeCompare(b.name));
    const noop = () => undefined;

    const markup = renderToStaticMarkup(<>{renderNodes(nodes, null, new Set(["docs"]), noop, noop, noop)}</>);

    expect(markup).toContain("lucide-chevron-down");
    expect(markup).toContain("lucide-chevron-right");
    expect((markup.match(/aria-label=\"Create document\"/g) ?? []).length).toBe(2);
  });
});
