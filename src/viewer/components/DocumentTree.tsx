import React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { identifierToPathname, toSidebarLabel } from "../navigation.js";
import { useLocale } from "../locale/index.js";
import type { CreationAnchorContext } from "../state/viewerState.js";

export interface DocumentTreeItem {
  identifier: string;
  title: string;
}

export interface TreeNode {
  name: string;
  path: string;
  item?: DocumentTreeItem;
  children: Map<string, TreeNode>;
}

const makeNode = (name: string, path: string): TreeNode => ({
  name,
  path,
  children: new Map<string, TreeNode>(),
});

export const buildTree = (items: DocumentTreeItem[]): TreeNode => {
  const root = makeNode("", "");
  const sorted = [...items].sort((a, b) => a.identifier.localeCompare(b.identifier));

  for (const item of sorted) {
    const parts = item.identifier.split("/");
    let cursor = root;
    let currentPath = "";

    for (let i = 0; i < parts.length; i += 1) {
      const part = parts[i] ?? "";
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const existing = cursor.children.get(part);
      const node = existing ?? makeNode(part, currentPath);
      if (!existing) {
        cursor.children.set(part, node);
      }

      if (i === parts.length - 1) {
        node.item = item;
      }

      cursor = node;
    }
  }

  return root;
};

const getAncestorPaths = (identifier: string | null): string[] => {
  if (!identifier) {
    return [];
  }

  const parts = identifier.split("/");
  return parts.slice(0, -1).map((_, index) => parts.slice(0, index + 1).join("/"));
};

export const renderNodes = (
  nodes: TreeNode[],
  selectedIdentifier: string | null,
  openPaths: Set<string>,
  onToggleOpen: (path: string, open: boolean) => void,
  onSelect: (identifier: string) => void,
  onCreateRequest: (anchor: CreationAnchorContext) => void,
): React.JSX.Element => {
  return (
    <ul>
      {nodes.map((node) => {
        const isFile = Boolean(node.item);
        const children = Array.from(node.children.values()).sort((a, b) => a.name.localeCompare(b.name));

        if (isFile) {
          const identifier = node.item?.identifier ?? node.path;
          const selected = identifier === selectedIdentifier;
          const href = identifierToPathname(identifier);
          return (
            <li key={node.path} className="viewer-tree-item">
              <div className="viewer-tree-row">
                <a
                  href={href}
                  onClick={(event) => {
                    event.preventDefault();
                    onSelect(identifier);
                  }}
                  aria-current={selected ? "page" : undefined}
                  className={`viewer-tree-button${selected ? " is-selected" : ""}`}
                  title={identifier}
                >
                  {toSidebarLabel(identifier, node.item?.title ?? node.name)}
                </a>
              </div>
            </li>
          );
        }

        const isOpen = openPaths.has(node.path);
        return (
          <li key={node.path} className="viewer-tree-item">
            <details
              open={isOpen}
              onToggle={(event) => {
                onToggleOpen(node.path, event.currentTarget.open);
              }}
            >
              <summary>
                <span className="viewer-tree-folder-label">
                  {isOpen ? (
                    <ChevronDown className="viewer-tree-folder-icon" size={16} aria-hidden="true" />
                  ) : (
                    <ChevronRight className="viewer-tree-folder-icon" size={16} aria-hidden="true" />
                  )}
                  <span>{node.name}</span>
                </span>
                <button
                  type="button"
                  className="viewer-tree-create"
                  aria-label="Create document"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onCreateRequest({ nodeType: "folder", nodePath: node.path });
                  }}
                >
                  +
                </button>
              </summary>
              {renderNodes(
                children,
                selectedIdentifier,
                openPaths,
                onToggleOpen,
                onSelect,
                onCreateRequest,
              )}
            </details>
          </li>
        );
      })}
    </ul>
  );
};

interface DocumentTreeProps {
  items: DocumentTreeItem[];
  selectedIdentifier: string | null;
  onSelect: (identifier: string) => void;
  onCreateRequest: (anchor: CreationAnchorContext) => void;
}

export function DocumentTree({
  items,
  selectedIdentifier,
  onSelect,
  onCreateRequest,
}: DocumentTreeProps): React.JSX.Element {
  const { t } = useLocale();
  const [openPaths, setOpenPaths] = React.useState<Set<string>>(() => new Set(getAncestorPaths(selectedIdentifier)));

  React.useEffect(() => {
    const ancestorPaths = getAncestorPaths(selectedIdentifier);
    if (!ancestorPaths.length) {
      return;
    }

    setOpenPaths((current) => {
      const next = new Set(current);
      for (const path of ancestorPaths) {
        next.add(path);
      }
      return next;
    });
  }, [selectedIdentifier]);

  const toggleOpen = React.useCallback((path: string, open: boolean): void => {
    setOpenPaths((current) => {
      const next = new Set(current);
      if (open) {
        next.add(path);
      } else {
        next.delete(path);
      }
      return next;
    });
  }, []);

  if (!items.length) {
    return <p className="viewer-muted">{t("noDocumentsTree")}</p>;
  }

  const root = buildTree(items);
  const nodes = Array.from(root.children.values()).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <nav aria-label={t("navDocuments")} className="viewer-tree">
      {renderNodes(
        nodes,
        selectedIdentifier,
        openPaths,
        toggleOpen,
        onSelect,
        onCreateRequest,
      )}
      <button
        type="button"
        className="viewer-tree-create-root"
        onClick={() => {
          onCreateRequest({ nodeType: "folder", nodePath: "." });
        }}
      >
        <span aria-hidden="true">+</span>
        {t("createDocument")}
      </button>
    </nav>
  );
}
