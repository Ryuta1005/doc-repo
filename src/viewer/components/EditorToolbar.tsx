import React from "react";
import {
  Save,
  ChevronDown,
  Quote,
  List,
  ListOrdered,
  SquareSplitVertical,
  ImagePlus,
  Info,
  Lightbulb,
  CircleAlert,
  AlertTriangle,
  Shield,
} from "lucide-react";
import type { Editor } from "@tiptap/react";

import { editorBlockShortcuts, getEditorShortcutLabel, withEditorShortcut } from "../shortcuts/editorShortcuts.js";
import { useLocale } from "../locale/index.js";
import { Tooltip } from "./Tooltip.js";

interface EditorToolbarProps {
  editor: Editor | null;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
  onUploadImage: (file: File) => Promise<{ imagePath: string; altText: string }>;
}

type AdmonitionType = "NOTE" | "TIP" | "IMPORTANT" | "WARNING" | "CAUTION";

const ADMONITION_TYPES: AdmonitionType[] = ["NOTE", "TIP", "IMPORTANT", "WARNING", "CAUTION"];

export function EditorToolbar({ editor, onSave, onCancel, isSaving, onUploadImage }: EditorToolbarProps): React.JSX.Element {
  const { t } = useLocale();
  const [isBlockMenuOpen, setIsBlockMenuOpen] = React.useState(false);
  const [isPanelMenuOpen, setIsPanelMenuOpen] = React.useState(false);
  const [isImageReading, setIsImageReading] = React.useState(false);
  const [selectionVersion, setSelectionVersion] = React.useState(0);
  const savedSelectionRef = React.useRef<{ from: number; to: number } | null>(null);
  const blockMenuRef = React.useRef<HTMLDivElement>(null);
  const blockMenuButtonRef = React.useRef<HTMLButtonElement>(null);
  const panelMenuRef = React.useRef<HTMLDivElement>(null);
  const panelMenuButtonRef = React.useRef<HTMLButtonElement>(null);
  const imageInputRef = React.useRef<HTMLInputElement>(null);

  const isSupportedImageFile = React.useCallback((file: File): boolean => {
    const hasSupportedMimeType = file.type === "image/png" || file.type === "image/jpeg";
    const hasSupportedExtension = /\.(png|jpe?g)$/i.test(file.name);
    return hasSupportedMimeType || hasSupportedExtension;
  }, []);

  const rememberSelection = React.useCallback(() => {
    if (!editor) {
      return;
    }

    const { from, to } = editor.state.selection;
    savedSelectionRef.current = { from, to };
  }, [editor]);

  React.useEffect(() => {
    if (!editor) {
      return;
    }

    const syncSelectionState = (): void => {
      setSelectionVersion((current) => current + 1);
    };

    editor.on("selectionUpdate", syncSelectionState);
    editor.on("transaction", syncSelectionState);

    return () => {
      editor.off("selectionUpdate", syncSelectionState);
      editor.off("transaction", syncSelectionState);
    };
  }, [editor]);

  const currentBlockType = React.useMemo(() => {
    if (!editor) return "paragraph";
    if (editor.isActive("heading", { level: 1 })) return "h1";
    if (editor.isActive("heading", { level: 2 })) return "h2";
    if (editor.isActive("heading", { level: 3 })) return "h3";
    if (editor.isActive("heading", { level: 4 })) return "h4";
    if (editor.isActive("heading", { level: 5 })) return "h5";
    if (editor.isActive("heading", { level: 6 })) return "h6";
    return "paragraph";
  }, [editor, selectionVersion]);

  const blockLabels: Record<string, string> = {
    paragraph: t("blockParagraph"),
    h1: t("blockHeading1"),
    h2: t("blockHeading2"),
    h3: t("blockHeading3"),
    h4: t("blockHeading4"),
    h5: t("blockHeading5"),
    h6: t("blockHeading6"),
  };

  const isBold = editor?.isActive("bold") ?? false;
  const isItalic = editor?.isActive("italic") ?? false;
  const isCode = editor?.isActive("code") ?? false;
  const isStrike = editor?.isActive("strike") ?? false;
  const isBlockquote = editor?.isActive("blockquote") ?? false;
  const isBulletList = editor?.isActive("bulletList") ?? false;
  const isOrderedList = editor?.isActive("orderedList") ?? false;
  const isCodeBlock = editor?.isActive("codeBlock") ?? false;

  const renderAdmonitionIcon = (type: AdmonitionType): React.JSX.Element => {
    if (type === "NOTE") {
      return <Info size={14} />;
    }
    if (type === "TIP") {
      return <Lightbulb size={14} />;
    }
    if (type === "IMPORTANT") {
      return <CircleAlert size={14} />;
    }
    if (type === "WARNING") {
      return <AlertTriangle size={14} />;
    }
    return <Shield size={14} />;
  };

  const getActiveAdmonitionType = React.useCallback((): AdmonitionType | null => {
    if (!editor || !editor.isActive("blockquote")) {
      return null;
    }

    const { $from } = editor.state.selection;
    for (let depth = $from.depth; depth >= 0; depth -= 1) {
      const node = $from.node(depth);
      if (node.type.name !== "blockquote") {
        continue;
      }

      const firstChild = node.firstChild;
      if (!firstChild || firstChild.type.name !== "paragraph") {
        return null;
      }

      const match = firstChild.textContent.match(/^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i);
      if (!match) {
        return null;
      }

      return match[1].toUpperCase() as AdmonitionType;
    }

    return null;
  }, [editor]);

  const activeAdmonitionType = getActiveAdmonitionType();

  const handleBlockChange = React.useCallback(
    (type: string) => {
      if (!editor) return;
      if (type === "paragraph") {
        editor.chain().focus().setParagraph().run();
      } else if (type === "h1") {
        editor.chain().focus().toggleHeading({ level: 1 }).run();
      } else if (type === "h2") {
        editor.chain().focus().toggleHeading({ level: 2 }).run();
      } else if (type === "h3") {
        editor.chain().focus().toggleHeading({ level: 3 }).run();
      } else if (type === "h4") {
        editor.chain().focus().toggleHeading({ level: 4 }).run();
      } else if (type === "h5") {
        editor.chain().focus().toggleHeading({ level: 5 }).run();
      } else if (type === "h6") {
        editor.chain().focus().toggleHeading({ level: 6 }).run();
      }
      setIsBlockMenuOpen(false);
    },
    [editor],
  );

  const insertAdmonition = React.useCallback(
    (type: AdmonitionType) => {
      if (!editor) {
        return;
      }

      const selection = savedSelectionRef.current ?? {
        from: editor.state.selection.from,
        to: editor.state.selection.to,
      };

      const selectedText = editor.state.doc.textBetween(selection.from, selection.to, "\n").trim();

      editor.chain().focus().setTextSelection(selection).run();

      editor
        .chain()
        .insertContentAt(selection, {
          type: "blockquote",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: `[!${type}]` }],
            },
            selectedText.length > 0
              ? {
                  type: "paragraph",
                  content: [{ type: "text", text: selectedText }],
                }
              : {
                  type: "paragraph",
                },
          ],
        })
        .run();
      setIsPanelMenuOpen(false);
      savedSelectionRef.current = null;
    },
    [editor],
  );

  const handleImageSelect = React.useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!editor) {
        return;
      }

      const file = event.target.files?.[0];
      event.target.value = "";

      if (!file) {
        return;
      }

      if (!isSupportedImageFile(file)) {
        window.alert(t("unsupportedImageType"));
        return;
      }

      setIsImageReading(true);
      try {
        const uploaded = await onUploadImage(file);
        const selection = savedSelectionRef.current ?? {
          from: editor.state.selection.from,
          to: editor.state.selection.to,
        };
        const escapedAltText = uploaded.altText.replace(/\[/g, "\\[").replace(/\]/g, "\\]");

        editor
          .chain()
          .focus()
          .setTextSelection(selection)
          .insertContent(`![${escapedAltText}](${uploaded.imagePath})`)
          .run();
      } catch (error) {
        const message = error instanceof Error ? error.message : t("imageLoadFailed");
        window.alert(message);
      } finally {
        savedSelectionRef.current = null;
        setIsImageReading(false);
      }
    },
    [editor, isSupportedImageFile, onUploadImage, t],
  );

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!isBlockMenuOpen) return;
      const blockTypes = ["paragraph", "h1", "h2", "h3", "h4", "h5", "h6"];
      const currentIndex = blockTypes.indexOf(currentBlockType);

      if (e.key === "ArrowDown") {
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % blockTypes.length;
        const nextButton = blockMenuRef.current?.querySelector<HTMLButtonElement>(
          `button[data-block-type="${blockTypes[nextIndex]}"]`,
        );
        nextButton?.focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prevIndex = (currentIndex - 1 + blockTypes.length) % blockTypes.length;
        const prevButton = blockMenuRef.current?.querySelector<HTMLButtonElement>(
          `button[data-block-type="${blockTypes[prevIndex]}"]`,
        );
        prevButton?.focus();
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const target = e.currentTarget.querySelector<HTMLButtonElement>(":focus");
        const blockType = target?.getAttribute("data-block-type");
        if (blockType) handleBlockChange(blockType);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setIsBlockMenuOpen(false);
        blockMenuButtonRef.current?.focus();
      }
    },
    [isBlockMenuOpen, currentBlockType, handleBlockChange],
  );

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        blockMenuRef.current &&
        !blockMenuRef.current.contains(e.target as Node) &&
        !blockMenuButtonRef.current?.contains(e.target as Node)
      ) {
        setIsBlockMenuOpen(false);
      }
    };
    if (isBlockMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isBlockMenuOpen]);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        panelMenuRef.current &&
        !panelMenuRef.current.contains(e.target as Node) &&
        !panelMenuButtonRef.current?.contains(e.target as Node)
      ) {
        setIsPanelMenuOpen(false);
      }
    };

    if (isPanelMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isPanelMenuOpen]);

  return (
    <div
      className="editor-toolbar-fixed flex items-center gap-0.5 border-b border-gray-200 bg-gray-50 px-2 py-2"
      role="toolbar"
      aria-label={t("editorToolbar")}
    >
      {/* ブロックタイプドロップダウン */}
      <div className="relative">
        <Tooltip content={withEditorShortcut(blockLabels[currentBlockType], editorBlockShortcuts[currentBlockType])}>
          <button
            ref={blockMenuButtonRef}
            type="button"
            onClick={() => setIsBlockMenuOpen(!isBlockMenuOpen)}
            aria-label={t("blockTypeSelect")}
            aria-haspopup="listbox"
            aria-expanded={isBlockMenuOpen}
            className="flex items-center gap-1 rounded px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 transition-colors"
          >
            {blockLabels[currentBlockType]}
            <ChevronDown size={16} className={isBlockMenuOpen ? "rotate-180" : ""} />
          </button>
        </Tooltip>

        {isBlockMenuOpen && (
          <div
            ref={blockMenuRef}
            role="listbox"
            onKeyDown={handleKeyDown}
            className="absolute top-full left-0 mt-1 w-56 rounded border border-gray-200 bg-white shadow-lg z-10"
          >
            {(["paragraph", "h1", "h2", "h3", "h4", "h5", "h6"] as const).map((blockType) => (
              <button
                key={blockType}
                type="button"
                data-block-type={blockType}
                role="option"
                aria-selected={currentBlockType === blockType}
                onClick={() => handleBlockChange(blockType)}
                className={`flex w-full items-center justify-between gap-4 px-3 py-2 text-left text-sm ${
                  currentBlockType === blockType
                    ? "bg-gray-300 text-slate-900 font-medium"
                    : "text-slate-700 hover:bg-slate-100"
                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-600 transition-colors`}
              >
                <span>{blockLabels[blockType]}</span>
                <span className="font-mono text-xs text-slate-500">
                  {getEditorShortcutLabel(editorBlockShortcuts[blockType])}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 情報パネル挿入 */}
      <div className="relative">
        <button
          ref={panelMenuButtonRef}
          type="button"
          onPointerDown={(event) => {
            event.preventDefault();
            rememberSelection();
          }}
          onMouseDown={(event) => {
            event.preventDefault();
            rememberSelection();
          }}
          onClick={() => setIsPanelMenuOpen(!isPanelMenuOpen)}
          aria-label={t("panelInsert")}
          aria-haspopup="listbox"
          aria-expanded={isPanelMenuOpen}
          className={`flex items-center gap-1 rounded px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
            activeAdmonitionType
              ? "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
              : "text-slate-700 hover:bg-slate-100"
          }`}
        >
          {activeAdmonitionType ? renderAdmonitionIcon(activeAdmonitionType) : <Info size={14} />}
          <span>{activeAdmonitionType ?? t("panel")}</span>
          <ChevronDown size={16} className={isPanelMenuOpen ? "rotate-180" : ""} />
        </button>

        {isPanelMenuOpen && (
          <div
            ref={panelMenuRef}
            role="listbox"
            className="absolute top-full left-0 mt-1 w-44 rounded border border-gray-200 bg-white shadow-lg z-10"
          >
            {ADMONITION_TYPES.map((panelType) => (
              <button
                key={panelType}
                type="button"
                onPointerDown={(event) => {
                  event.preventDefault();
                }}
                onMouseDown={(event) => {
                  event.preventDefault();
                }}
                role="option"
                aria-label={`${panelType} ${t("panelInsertType")}`}
                onClick={() => insertAdmonition(panelType)}
                className="flex w-full items-center gap-2 text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-600 transition-colors"
              >
                {renderAdmonitionIcon(panelType)}
                {panelType}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* セパレータ */}
      <div className="mx-1 h-6 w-px bg-gray-200" />

      {/* インライン書式 */}
      <div className="flex items-center gap-1">
        <Tooltip content={withEditorShortcut(t("bold"), "bold")}>
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleBold().run()}
            aria-label={withEditorShortcut(t("bold"), "bold")}
            aria-pressed={isBold}
            className={`rounded-sm px-2.5 py-2 text-sm font-bold transition-colors ${
              isBold
                ? "bg-gray-300 text-slate-900"
                : "text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-500"
            } focus-visible:outline-none focus-visible:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            B
          </button>
        </Tooltip>
        <Tooltip content={withEditorShortcut(t("italic"), "italic")}>
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            aria-label={withEditorShortcut(t("italic"), "italic")}
            aria-pressed={isItalic}
            className={`rounded-sm px-2.5 py-2 text-sm italic transition-colors ${
              isItalic
                ? "bg-gray-300 text-slate-900"
                : "text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-500"
            } focus-visible:outline-none focus-visible:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            I
          </button>
        </Tooltip>
        <Tooltip content={withEditorShortcut(t("strike"), "strike")}>
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleStrike().run()}
            aria-label={withEditorShortcut(t("strike"), "strike")}
            aria-pressed={isStrike}
            className={`rounded-sm px-2.5 py-2 text-sm transition-colors ${
              isStrike
                ? "bg-gray-300 text-slate-900"
                : "text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-500"
            } focus-visible:outline-none focus-visible:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <span className="line-through">S</span>
          </button>
        </Tooltip>
        <Tooltip content={withEditorShortcut(t("inlineCode"), "code")}>
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleCode().run()}
            aria-label={withEditorShortcut(t("inlineCode"), "code")}
            aria-pressed={isCode}
            className={`rounded-sm px-2.5 py-2 text-sm font-mono transition-colors ${
              isCode
                ? "bg-gray-300 text-slate-900"
                : "text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-500"
            } focus-visible:outline-none focus-visible:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {"</>"}
          </button>
        </Tooltip>
      </div>

      {/* セパレータ */}
      <div className="mx-1 h-6 w-px bg-gray-200" />

      {/* リスト・引用 */}
      <div className="flex items-center gap-1">
        <Tooltip content={withEditorShortcut(t("blockquote"), "blockquote")}>
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            aria-label={withEditorShortcut(t("blockquote"), "blockquote")}
            aria-pressed={isBlockquote}
            className={`flex items-center rounded-sm px-2.5 py-2 text-sm transition-colors ${
              isBlockquote
                ? "bg-gray-300 text-slate-900"
                : "text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-500"
            } focus-visible:outline-none focus-visible:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Quote size={14} />
          </button>
        </Tooltip>
        <Tooltip content={withEditorShortcut(t("bulletList"), "bulletList")}>
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            aria-label={withEditorShortcut(t("bulletList"), "bulletList")}
            aria-pressed={isBulletList}
            className={`flex items-center rounded-sm px-2.5 py-2 text-sm transition-colors ${
              isBulletList
                ? "bg-gray-300 text-slate-900"
                : "text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-500"
            } focus-visible:outline-none focus-visible:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <List size={14} />
          </button>
        </Tooltip>
        <Tooltip content={withEditorShortcut(t("orderedList"), "orderedList")}>
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            aria-label={withEditorShortcut(t("orderedList"), "orderedList")}
            aria-pressed={isOrderedList}
            className={`flex items-center rounded-sm px-2.5 py-2 text-sm transition-colors ${
              isOrderedList
                ? "bg-gray-300 text-slate-900"
                : "text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-500"
            } focus-visible:outline-none focus-visible:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <ListOrdered size={14} />
          </button>
        </Tooltip>
      </div>

      {/* セパレータ */}
      <div className="mx-1 h-6 w-px bg-gray-200" />

      {/* その他 */}
      <div className="flex items-center gap-1">
        <Tooltip content={withEditorShortcut(t("horizontalRule"), "horizontalRule")}>
          <button
            type="button"
            onClick={() => editor?.chain().focus().setHorizontalRule().run()}
            aria-label={withEditorShortcut(t("horizontalRule"), "horizontalRule")}
            className="flex items-center rounded-sm px-2.5 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SquareSplitVertical size={14} />
          </button>
        </Tooltip>
        <Tooltip content={t("attachImageWithTypes")}>
          <button
            type="button"
            onPointerDown={(event) => {
              event.preventDefault();
              rememberSelection();
            }}
            onMouseDown={(event) => {
              event.preventDefault();
              rememberSelection();
            }}
            onClick={() => imageInputRef.current?.click()}
            aria-label={t("attachImage")}
            disabled={isImageReading}
            className="flex items-center rounded-sm px-2.5 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ImagePlus size={14} />
          </button>
        </Tooltip>
        <Tooltip content={withEditorShortcut(t("codeBlock"), "codeBlock")}>
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
            aria-label={withEditorShortcut(t("codeBlock"), "codeBlock")}
            aria-pressed={isCodeBlock}
            className={`rounded-sm px-2.5 py-2 text-sm font-mono transition-colors ${
              isCodeBlock
                ? "bg-gray-300 text-slate-900"
                : "text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-500"
            } focus-visible:outline-none focus-visible:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {"{}"}
          </button>
        </Tooltip>
      </div>

      {/* スペーサー */}
      <div className="flex-1" />

      {/* 操作ボタン */}
      <button
        type="button"
        onClick={onCancel}
        aria-label={t("cancelEdit")}
        disabled={isSaving}
        className="rounded px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {t("cancel")}
      </button>
      <Tooltip content={withEditorShortcut(t("save"), "save")}>
        <button
          type="button"
          onClick={onSave}
          aria-label={isSaving ? t("saving") : withEditorShortcut(t("saveEdit"), "save")}
          disabled={isSaving}
          className="ml-2 flex items-center gap-2 rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          <Save size={16} />
          {isSaving ? t("saving") : t("save")}
        </button>
      </Tooltip>
      <input
        ref={imageInputRef}
        type="file"
        accept="image/png,image/jpeg,.png,.jpg,.jpeg"
        onChange={(event) => {
          void handleImageSelect(event);
        }}
        className="hidden"
      />
    </div>
  );
}
