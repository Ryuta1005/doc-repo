import React from "react";
import { ChevronDown, ChevronRight, Ellipsis, Plus, Trash2 } from "lucide-react";
import { identifierToPathname, toSidebarLabel } from "../navigation.js";
import { useLocale } from "../locale/index.js";
import type { CreationAnchorContext, DeleteTargetContext } from "../state/viewerState.js";

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
  onDeleteRequest: (target: DeleteTargetContext) => void,
  t: (key: "deleteAction") => string,
  hoveredPath: string | null,
  menuPath: string | null,
  setHoveredPath: React.Dispatch<React.SetStateAction<string | null>>,
  setMenuPath: React.Dispatch<React.SetStateAction<string | null>>,
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
          const actionsVisible = hoveredPath === node.path || menuPath === node.path;
          return (
            <li key={node.path} className="viewer-tree-item">
              <div
                className="viewer-tree-row"
                onMouseEnter={() => {
                  setHoveredPath(node.path);
                }}
                onMouseLeave={() => {
                  setHoveredPath((current) => (current === node.path ? null : current));
                }}
              >
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
                <div className="viewer-tree-actions">
                  <button
                    type="button"
                    className={`viewer-tree-row-menu${actionsVisible ? " is-visible" : ""}`}
                    aria-label="Row menu"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setMenuPath((current) => (current === node.path ? null : node.path));
                    }}
                  >
                    <Ellipsis size={14} aria-hidden="true" />
                  </button>
                  {menuPath === node.path ? (
                    <div className="viewer-tree-row-menu-popover" role="menu">
                      <button
                        type="button"
                        className="viewer-tree-row-menu-item is-danger"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          setMenuPath(null);
                          onDeleteRequest({
                            targetType: "file",
                            path: identifier,
                            displayName: toSidebarLabel(identifier, node.item?.title ?? node.name),
                          });
                        }}
                      >
                        <Trash2 size={14} aria-hidden="true" />
                        {t("deleteAction")}
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </li>
          );
        }

        const isOpen = openPaths.has(node.path);
        const actionsVisible = hoveredPath === node.path || menuPath === node.path;
        return (
          <li key={node.path} className="viewer-tree-item">
            <details
              open={isOpen}
              onToggle={(event) => {
                onToggleOpen(node.path, event.currentTarget.open);
              }}
            >
              <summary
                onMouseEnter={() => {
                  setHoveredPath(node.path);
                }}
                onMouseLeave={() => {
                  setHoveredPath((current) => (current === node.path ? null : current));
                }}
              >
                <span className="viewer-tree-folder-label">
                  {isOpen ? (
                    <ChevronDown className="viewer-tree-folder-icon" size={16} aria-hidden="true" />
                  ) : (
                    <ChevronRight className="viewer-tree-folder-icon" size={16} aria-hidden="true" />
                  )}
                  <span>{node.name}</span>
                </span>
                <div className="viewer-tree-folder-actions">
                  <button
                    type="button"
                    className={`viewer-tree-create${actionsVisible ? " is-visible" : ""}`}
                    aria-label="Create document"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      onCreateRequest({ nodeType: "folder", nodePath: node.path });
                    }}
                  >
                    <Plus size={16} aria-hidden="true" />
                  </button>
                  <div className="viewer-tree-actions">
                    <button
                      type="button"
                      className={`viewer-tree-row-menu${actionsVisible ? " is-visible" : ""}`}
                      aria-label="Row menu"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setMenuPath((current) => (current === node.path ? null : node.path));
                      }}
                    >
                      <Ellipsis size={16} aria-hidden="true" />
                    </button>
                    {menuPath === node.path ? (
                      <div className="viewer-tree-row-menu-popover" role="menu">
                        <button
                          type="button"
                          className="viewer-tree-row-menu-item is-danger"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            setMenuPath(null);
                            onDeleteRequest({
                              targetType: "folder",
                              path: node.path,
                              displayName: node.name,
                            });
                          }}
                        >
                          <Trash2 size={14} aria-hidden="true" />
                          {t("deleteAction")}
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </summary>
              {renderNodes(
                children,
                selectedIdentifier,
                openPaths,
                onToggleOpen,
                onSelect,
                onCreateRequest,
                onDeleteRequest,
                t,
                hoveredPath,
                menuPath,
                setHoveredPath,
                setMenuPath,
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
  onDeleteRequest: (target: DeleteTargetContext) => void;
}

export function DocumentTree({
  items,
  selectedIdentifier,
  onSelect,
  onCreateRequest,
  onDeleteRequest,
}: DocumentTreeProps): React.JSX.Element {
  const { t } = useLocale();
  const [openPaths, setOpenPaths] = React.useState<Set<string>>(() => new Set(getAncestorPaths(selectedIdentifier)));
  const [hoveredPath, setHoveredPath] = React.useState<string | null>(null);
  const [menuPath, setMenuPath] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!menuPath) {
      return;
    }

    const closeMenuOnOutsidePointerDown = (event: PointerEvent): void => {
      const target = event.target;
      if (target instanceof Element && target.closest(".viewer-tree-actions")) {
        return;
      }
      setMenuPath(null);
    };

    const closeMenuOnEscape = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setMenuPath(null);
      }
    };

    document.addEventListener("pointerdown", closeMenuOnOutsidePointerDown);
    document.addEventListener("keydown", closeMenuOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeMenuOnOutsidePointerDown);
      document.removeEventListener("keydown", closeMenuOnEscape);
    };
  }, [menuPath]);

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
        onDeleteRequest,
        (key) => t(key),
        hoveredPath,
        menuPath,
        setHoveredPath,
        setMenuPath,
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
