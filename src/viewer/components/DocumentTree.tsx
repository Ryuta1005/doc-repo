import React from "react";
import { identifierToPathname } from "../navigation.js";

export interface DocumentTreeItem {
  identifier: string;
  title: string;
}

interface TreeNode {
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

const buildTree = (items: DocumentTreeItem[]): TreeNode => {
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

const renderNodes = (
  nodes: TreeNode[],
  selectedIdentifier: string | null,
  openPaths: Set<string>,
  onToggleOpen: (path: string, open: boolean) => void,
  onSelect: (identifier: string) => void,
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
                {node.item?.title ?? node.name}
              </a>
            </li>
          );
        }

        return (
          <li key={node.path} className="viewer-tree-item">
            <details
              open={openPaths.has(node.path)}
              onToggle={(event) => {
                onToggleOpen(node.path, event.currentTarget.open);
              }}
            >
              <summary>{node.name}</summary>
              {renderNodes(children, selectedIdentifier, openPaths, onToggleOpen, onSelect)}
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
}

export function DocumentTree({ items, selectedIdentifier, onSelect }: DocumentTreeProps): React.JSX.Element {
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
    return <p className="viewer-muted">ドキュメントがありません。</p>;
  }

  const root = buildTree(items);
  const nodes = Array.from(root.children.values()).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <nav aria-label="Documents" className="viewer-tree">
      {renderNodes(nodes, selectedIdentifier, openPaths, toggleOpen, onSelect)}
    </nav>
  );
}
