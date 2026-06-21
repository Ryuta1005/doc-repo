// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LocaleProvider, LOCALE_STORAGE_KEY } from "../locale/index.js";
import { DeleteConfirmationDialog } from "./DeleteConfirmationDialog.js";
import { buildTree, DocumentTree, renderNodes, type DocumentTreeItem } from "./DocumentTree.js";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const items: DocumentTreeItem[] = [
  { identifier: "docs/guide/getting-started.md", title: "Getting Started" },
  { identifier: "docs/readme.md", title: "Readme" },
];

describe("DocumentTree", () => {
  let container: HTMLDivElement;
  let root: Root | null;

  beforeEach(() => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, "ja");
    container = document.createElement("div");
    document.body.append(container);
    root = null;
  });

  afterEach(() => {
    act(() => {
      root?.unmount();
    });
    container.remove();
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("shows create button only for folders and renders open/closed chevrons", () => {
    const root = buildTree(items);
    const nodes = Array.from(root.children.values()).sort((a, b) => a.name.localeCompare(b.name));
    const noop = () => undefined;
    const setPath: React.Dispatch<React.SetStateAction<string | null>> = () => undefined;

    const markup = renderToStaticMarkup(
      <>
        {renderNodes(
          nodes,
          null,
          new Set(["docs"]),
          noop,
          noop,
          noop,
          noop,
          (key) => (key === "deleteAction" ? "Delete" : ""),
          null,
          null,
          setPath,
          setPath,
        )}
      </>,
    );

    expect(markup).toContain("lucide-chevron-down");
    expect(markup).toContain("lucide-chevron-right");
    expect((markup.match(/aria-label=\"Create document\"/g) ?? []).length).toBe(2);
    expect(markup).toContain("viewer-tree-folder-actions");
    expect(markup.indexOf("viewer-tree-folder-label")).toBeLessThan(markup.indexOf("viewer-tree-folder-actions"));
  });

  it("opens the folder row delete menu without toggling the folder", () => {
    const onDeleteRequest = vi.fn();

    act(() => {
      root = createRoot(container);
      root.render(
        <LocaleProvider>
          <DocumentTree
            items={items}
            selectedIdentifier={null}
            onSelect={vi.fn()}
            onCreateRequest={vi.fn()}
            onDeleteRequest={onDeleteRequest}
          />
        </LocaleProvider>,
      );
    });

    const docsSummary = Array.from(container.querySelectorAll("summary")).find((summary) =>
      summary.textContent?.includes("docs"),
    );
    expect(docsSummary).toBeTruthy();
    const details = docsSummary?.closest("details");
    expect(details?.open).toBe(false);

    act(() => {
      docsSummary?.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    });

    const folderMenuButton = docsSummary?.querySelector<HTMLButtonElement>(".viewer-tree-row-menu");
    const folderCreateButton = docsSummary?.querySelector<HTMLButtonElement>(".viewer-tree-create");
    expect(folderCreateButton?.className).toContain("is-visible");
    expect(folderMenuButton?.className).toContain("is-visible");

    act(() => {
      folderMenuButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(details?.open).toBe(false);
    const deleteButton = docsSummary?.querySelector<HTMLButtonElement>(".viewer-tree-row-menu-item");
    expect(deleteButton?.textContent).toContain("削除");

    act(() => {
      deleteButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onDeleteRequest).toHaveBeenCalledWith({
      targetType: "folder",
      path: "docs",
      displayName: "docs",
    });
  });

  it("does not leave the parent folder row menu visible when hovering a child row", () => {
    act(() => {
      root = createRoot(container);
      root.render(
        <LocaleProvider>
          <DocumentTree
            items={items}
            selectedIdentifier="docs/guide/getting-started.md"
            onSelect={vi.fn()}
            onCreateRequest={vi.fn()}
            onDeleteRequest={vi.fn()}
          />
        </LocaleProvider>,
      );
    });

    const docsSummary = Array.from(container.querySelectorAll("summary")).find((summary) =>
      summary.textContent?.includes("docs"),
    );
    const childRow = Array.from(container.querySelectorAll(".viewer-tree-row")).find((row) =>
      row.textContent?.includes("Getting Started"),
    );
    const folderMenuButton = docsSummary?.querySelector<HTMLButtonElement>(".viewer-tree-row-menu");
    const folderCreateButton = docsSummary?.querySelector<HTMLButtonElement>(".viewer-tree-create");

    act(() => {
      childRow?.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    });

    expect(folderCreateButton?.className).not.toContain("is-visible");
    expect(folderMenuButton?.className).not.toContain("is-visible");
  });

  it("closes an open row menu when clicking outside the row actions", () => {
    act(() => {
      root = createRoot(container);
      root.render(
        <LocaleProvider>
          <DocumentTree
            items={items}
            selectedIdentifier={null}
            onSelect={vi.fn()}
            onCreateRequest={vi.fn()}
            onDeleteRequest={vi.fn()}
          />
        </LocaleProvider>,
      );
    });

    const docsSummary = Array.from(container.querySelectorAll("summary")).find((summary) =>
      summary.textContent?.includes("docs"),
    );
    const folderMenuButton = docsSummary?.querySelector<HTMLButtonElement>(".viewer-tree-row-menu");

    act(() => {
      docsSummary?.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
      folderMenuButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(docsSummary?.querySelector(".viewer-tree-row-menu-item")).toBeTruthy();

    act(() => {
      document.body.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    });

    expect(docsSummary?.querySelector(".viewer-tree-row-menu-item")).toBeNull();
  });

  it("renders delete confirmation with compact title and no duplicate prompt", () => {
    act(() => {
      root = createRoot(container);
      root.render(
        <LocaleProvider>
          <DeleteConfirmationDialog open targetName="config.ja" onCancel={vi.fn()} onConfirm={vi.fn()} />
        </LocaleProvider>,
      );
    });

    const title = container.querySelector("#delete-dialog-title");
    expect(title?.tagName).toBe("H4");
    expect(title?.textContent).toBe("削除しますか？");
    expect(title?.className).toContain("dialog-title-compact");
    expect(container.textContent).toContain("config.ja");
    expect(container.textContent).toContain("Git Commitなどをしていない場合、元に戻せません。");
    expect(container.textContent?.match(/本当に削除しますか？/g)).toBeNull();
  });
});
