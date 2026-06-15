export type EditorShortcutId =
  | "paragraph"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "bold"
  | "italic"
  | "strike"
  | "code"
  | "blockquote"
  | "bulletList"
  | "orderedList"
  | "horizontalRule"
  | "codeBlock"
  | "save";

interface KeyboardShortcut {
  alt?: boolean;
  shift?: boolean;
  key?: string;
  code?: string;
}

const editorShortcuts: Record<EditorShortcutId, KeyboardShortcut> = {
  paragraph: { alt: true, key: "0", code: "Digit0" },
  h1: { alt: true, key: "1", code: "Digit1" },
  h2: { alt: true, key: "2", code: "Digit2" },
  h3: { alt: true, key: "3", code: "Digit3" },
  h4: { alt: true, key: "4", code: "Digit4" },
  h5: { alt: true, key: "5", code: "Digit5" },
  h6: { alt: true, key: "6", code: "Digit6" },
  bold: { key: "b" },
  italic: { key: "i" },
  strike: { shift: true, key: "s" },
  code: { shift: true, key: "m" },
  blockquote: { shift: true, key: "b" },
  bulletList: { shift: true, key: "8", code: "Digit8" },
  orderedList: { shift: true, key: "7", code: "Digit7" },
  horizontalRule: { shift: true, key: "-", code: "Minus" },
  codeBlock: { alt: true, key: "c" },
  save: { key: "enter" },
};

const shortcutDisplayLabels: Record<EditorShortcutId, string[]> = {
  paragraph: ["primary", "alt", "0"],
  h1: ["primary", "alt", "1"],
  h2: ["primary", "alt", "2"],
  h3: ["primary", "alt", "3"],
  h4: ["primary", "alt", "4"],
  h5: ["primary", "alt", "5"],
  h6: ["primary", "alt", "6"],
  bold: ["primary", "B"],
  italic: ["primary", "I"],
  strike: ["primary", "shift", "S"],
  code: ["primary", "shift", "M"],
  blockquote: ["primary", "shift", "B"],
  bulletList: ["primary", "shift", "8"],
  orderedList: ["primary", "shift", "7"],
  horizontalRule: ["primary", "shift", "-"],
  codeBlock: ["primary", "alt", "C"],
  save: ["primary", "Enter"],
};

export const editorBlockShortcuts: Record<string, EditorShortcutId> = {
  paragraph: "paragraph",
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  h5: "h5",
  h6: "h6",
};

const getPlatform = (): string => {
  if (typeof navigator === "undefined") {
    return "";
  }

  const userAgentData = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData;
  return userAgentData?.platform ?? navigator.platform ?? "";
};

const isMacPlatform = (): boolean => /mac|iphone|ipad|ipod/i.test(getPlatform());

export const isPrimaryShortcut = (event: KeyboardEvent): boolean => event.metaKey || event.ctrlKey;

export const matchesEditorShortcut = (event: KeyboardEvent, shortcutId: EditorShortcutId): boolean => {
  const shortcut = editorShortcuts[shortcutId];
  const key = event.key.toLowerCase();
  const expectedAlt = shortcut.alt ?? false;
  const expectedShift = shortcut.shift ?? false;

  if (!isPrimaryShortcut(event) || event.altKey !== expectedAlt || event.shiftKey !== expectedShift) {
    return false;
  }

  return shortcut.key === key || Boolean(shortcut.code && shortcut.code === event.code);
};

export const getEditorShortcutLabel = (shortcutId: EditorShortcutId): string => {
  const isMac = isMacPlatform();
  const parts = shortcutDisplayLabels[shortcutId].map((part) => {
    if (part === "primary") {
      return isMac ? "⌘" : "Ctrl";
    }
    if (part === "alt") {
      return isMac ? "⌥" : "Alt";
    }
    if (part === "shift") {
      return isMac ? "⇧" : "Shift";
    }
    return part;
  });

  return parts.join(isMac ? "" : "+");
};

export const withEditorShortcut = (label: string, shortcutId: EditorShortcutId): string =>
  `${label} ${getEditorShortcutLabel(shortcutId)}`;
