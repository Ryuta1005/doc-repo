const treeEl = document.getElementById("tree");
const articleEl = document.getElementById("article");

const uiState = {
  expandedDirs: new Set(),
  selectedId: null,
};

const readPageIdFromHash = () => {
  const raw = window.location.hash.replace(/^#/, "");
  if (!raw) {
    return null;
  }

  const encoded = raw.startsWith("doc=") ? raw.slice(4) : raw;
  try {
    return decodeURIComponent(encoded);
  } catch {
    return encoded;
  }
};

const parseDocHashToId = (rawHash) => {
  if (!rawHash) {
    return null;
  }

  const raw = rawHash.replace(/^#/, "");
  const encoded = raw.startsWith("doc=") ? raw.slice(4) : raw;
  try {
    return decodeURIComponent(encoded);
  } catch {
    return encoded;
  }
};

const writePageIdToHash = (id) => {
  const nextHash = `#doc=${encodeURIComponent(id)}`;
  if (window.location.hash !== nextHash) {
    window.location.hash = nextHash;
  }
};

const hasPage = (id) => state.pages.some((page) => page.id === id);

const expandDirsForPageId = (id) => {
  const segments = id.split("/");
  segments.pop();

  let key = "";
  for (const segment of segments) {
    key = key ? `${key}/${segment}` : segment;
    uiState.expandedDirs.add(key);
  }
};

const selectPage = (id, options = {}) => {
  const { syncHash = false } = options;
  if (!hasPage(id)) {
    return;
  }

  uiState.selectedId = id;
  expandDirsForPageId(id);
  renderTree(state.tree);
  renderArticle(id);

  if (syncHash) {
    writePageIdToHash(id);
  }
};

const collectDirKeys = (nodes, parentKey = "", out = new Set()) => {
  for (const node of nodes) {
    if (node.type !== "dir") {
      continue;
    }

    const key = parentKey ? `${parentKey}/${node.name}` : node.name;
    out.add(key);
    collectDirKeys(node.children || [], key, out);
  }

  return out;
};

const renderTree = (nodes) => {
  const createList = (items, parentKey = "") => {
    const ul = document.createElement("ul");

    for (const item of items) {
      const li = document.createElement("li");
      const row = document.createElement("div");
      row.className = "tree-row";

      const marker = document.createElement("span");
      marker.className = "tree-marker";
      marker.textContent = "•";
      row.appendChild(marker);

      if (item.type === "dir") {
        const dirKey = parentKey ? `${parentKey}/${item.name}` : item.name;
        const isExpanded = uiState.expandedDirs.has(dirKey);

        const button = document.createElement("button");
        button.type = "button";
        button.className = "dir-toggle";
        button.textContent = `${isExpanded ? "▾" : "▸"} ${item.name}`;
        button.setAttribute("aria-expanded", String(isExpanded));
        button.addEventListener("click", () => {
          if (uiState.expandedDirs.has(dirKey)) {
            uiState.expandedDirs.delete(dirKey);
          } else {
            uiState.expandedDirs.add(dirKey);
          }
          renderTree(state.tree);
        });

        const children = createList(item.children || [], dirKey);
        children.hidden = !isExpanded;

        row.appendChild(button);
        li.appendChild(row);
        li.appendChild(children);
      } else {
        const link = document.createElement("a");
        link.href = "#";
        link.textContent = item.name;
        if (item.id === uiState.selectedId) {
          link.classList.add("selected");
          link.setAttribute("aria-current", "page");
        }
        link.addEventListener("click", (event) => {
          event.preventDefault();
          selectPage(item.id, { syncHash: true });
        });
        row.appendChild(link);
        li.appendChild(row);
      }

      ul.appendChild(li);
    }

    return ul;
  };

  treeEl.replaceChildren(createList(nodes));
};

let state = { pages: [], tree: [] };

const loadEmbeddedState = () => {
  const dataEl = document.getElementById("doc-repo-data");
  if (!dataEl || !dataEl.textContent) {
    return null;
  }

  try {
    return JSON.parse(dataEl.textContent);
  } catch {
    return null;
  }
};

const renderArticle = (id) => {
  const page = state.pages.find((value) => value.id === id);
  if (!page) {
    articleEl.innerHTML = '<p class="muted">Document not found.</p>';
    return;
  }

  articleEl.innerHTML = page.html;
};

const bindArticleInternalLinks = () => {
  articleEl.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const anchor = target.closest("a");
    if (!(anchor instanceof HTMLAnchorElement)) {
      return;
    }

    const href = anchor.getAttribute("href");
    if (!href?.startsWith("#doc=")) {
      return;
    }

    // 生成時に実在ページと突き合わせ済みの #doc= リンクのみを内部遷移として扱う。
    const docId = parseDocHashToId(href);
    if (!docId || !hasPage(docId)) {
      return;
    }

    event.preventDefault();
    selectPage(docId, { syncHash: true });
  });
};

const bootstrap = async () => {
  const embedded = loadEmbeddedState();
  if (embedded) {
    state = embedded;
  } else {
    const response = await fetch("./content.json");
    state = await response.json();
  }

  if (state.pages[0]) {
    bindArticleInternalLinks();
    uiState.expandedDirs = collectDirKeys(state.tree);
    const hashPageId = readPageIdFromHash();
    if (hashPageId && hasPage(hashPageId)) {
      selectPage(hashPageId);
    } else {
      selectPage(state.pages[0].id, { syncHash: true });
    }

    window.addEventListener("hashchange", () => {
      const nextId = readPageIdFromHash();
      if (!nextId || nextId === uiState.selectedId || !hasPage(nextId)) {
        return;
      }
      selectPage(nextId);
    });
  } else {
    articleEl.innerHTML = '<p class="muted">No Markdown files found.</p>';
  }
};

bootstrap().catch((error) => {
  articleEl.innerHTML = `<p class="muted">Failed to load site data: ${String(error)}</p>`;
});
