import React from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { mergeAttributes, Node as TiptapNode } from "@tiptap/core";

import {
  parseEditableMarkdown,
  serializeEditableMarkdown,
  type MarkdownEditorDocument,
} from "../../core/markdown/index.js";
import { useEditorShortcuts } from "../hooks/useEditorShortcuts.js";
import { uploadDocumentImage } from "../services/apiClient.js";
import { useLocale } from "../locale/index.js";
import { EditorToolbar } from "./EditorToolbar.js";

export interface DocumentEditorSnapshot {
  document: MarkdownEditorDocument;
  markdown: string;
  newlineStyle: "lf" | "crlf";
  hasTrailingNewline: boolean;
  isDirty: boolean;
}

interface DocumentEditorProps {
  documentIdentifier: string;
  filename: string;
  filenamePlaceholder: string;
  filenameReadOnly: boolean;
  onFilenameChange: (filename: string) => void;
  sourceMarkdown: string;
  onSnapshotChange: (snapshot: DocumentEditorSnapshot) => void;
  onSaveRequest: (snapshot: DocumentEditorSnapshot) => void;
  onCancelRequest: () => void;
  isSaving: boolean;
}

const RawMarkdownBlock = TiptapNode.create({
  name: "rawMarkdown",
  group: "block",
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      rawMarkdown: {
        default: "",
      },
      segmentId: {
        default: "",
      },
    };
  },

  parseHTML() {
    return [{ tag: 'pre[data-raw-markdown="true"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "pre",
      mergeAttributes(HTMLAttributes, {
        class: "editor-raw-block",
        "data-raw-markdown": "true",
      }),
      HTMLAttributes.rawMarkdown ?? "",
    ];
  },
});

const buildSnapshot = (
  document: MarkdownEditorDocument,
  newlineStyle: "lf" | "crlf",
  hasTrailingNewline: boolean,
  initialDocument: string,
): DocumentEditorSnapshot => {
  const markdown = serializeEditableMarkdown(document, { newlineStyle, hasTrailingNewline });
  return {
    document,
    markdown,
    newlineStyle,
    hasTrailingNewline,
    isDirty: JSON.stringify(document) !== initialDocument,
  };
};

export function DocumentEditor({
  documentIdentifier,
  filename,
  filenamePlaceholder,
  filenameReadOnly,
  onFilenameChange,
  sourceMarkdown,
  onSnapshotChange,
  onSaveRequest,
  onCancelRequest,
  isSaving,
}: DocumentEditorProps): React.JSX.Element {
  const { t } = useLocale();
  const [initialParsed] = React.useState(() => parseEditableMarkdown(sourceMarkdown));
  const initialDocumentKey = React.useMemo(() => JSON.stringify(initialParsed.document), [initialParsed.document]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
        bulletList: {},
        horizontalRule: {},
        listItem: {},
        orderedList: {},
        strike: {},
      }),
      RawMarkdownBlock,
    ],
    content: initialParsed.document,
    editorProps: {
      attributes: {
        class:
          "editor-surface [&_h1]:text-[2.5rem] [&_h1]:font-bold [&_h2]:text-[2rem] [&_h2]:font-bold [&_h3]:text-[1.5rem] [&_h3]:font-bold",
      },
    },
    onUpdate: ({ editor: nextEditor }) => {
      const document = nextEditor.getJSON() as MarkdownEditorDocument;
      onSnapshotChange(
        buildSnapshot(document, initialParsed.newlineStyle, initialParsed.hasTrailingNewline, initialDocumentKey),
      );
    },
  });

  React.useEffect(() => {
    const snapshot = buildSnapshot(
      initialParsed.document,
      initialParsed.newlineStyle,
      initialParsed.hasTrailingNewline,
      initialDocumentKey,
    );
    onSnapshotChange(snapshot);
  }, [initialDocumentKey, initialParsed, onSnapshotChange]);

  React.useEffect(() => {
    if (!editor) {
      return;
    }

    const syncAdmonitionAttributes = (): void => {
      const root = editor.view.dom as HTMLElement;
      root.querySelectorAll("blockquote").forEach((blockquote) => {
        const firstParagraph = blockquote.querySelector("p");
        const text = firstParagraph?.textContent ?? "";
        const match = text.match(/^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i);

        if (match) {
          blockquote.setAttribute("data-admonition", match[1].toLowerCase());
        } else {
          blockquote.removeAttribute("data-admonition");
        }
      });
    };

    syncAdmonitionAttributes();
    editor.on("update", syncAdmonitionAttributes);
    editor.on("selectionUpdate", syncAdmonitionAttributes);

    return () => {
      editor.off("update", syncAdmonitionAttributes);
      editor.off("selectionUpdate", syncAdmonitionAttributes);
    };
  }, [editor]);

  const handleSave = React.useCallback(() => {
    if (!editor) {
      return;
    }

    const document = editor.getJSON() as MarkdownEditorDocument;
    onSaveRequest(
      buildSnapshot(document, initialParsed.newlineStyle, initialParsed.hasTrailingNewline, initialDocumentKey),
    );
  }, [editor, initialDocumentKey, initialParsed, onSaveRequest]);

  useEditorShortcuts({ editor, onSave: handleSave });

  const handleUploadImage = React.useCallback(
    async (file: File): Promise<{ imagePath: string; altText: string }> => {
      const uploaded = await uploadDocumentImage(documentIdentifier, file);
      const altTextCandidate = file.name.replace(/\.(png|jpe?g)$/i, "").trim();
      return {
        imagePath: uploaded.imagePath,
        altText: altTextCandidate || "image",
      };
    },
    [documentIdentifier],
  );

  if (!editor) {
    return <p className="viewer-muted">{t("editorPreparing")}</p>;
  }

  return (
    <section className="editor-panel">
      <div className="editor-frame">
        <EditorToolbar
          editor={editor}
          onSave={handleSave}
          onCancel={onCancelRequest}
          isSaving={isSaving}
          onUploadImage={handleUploadImage}
        />
        <div className="editor-filename-row">
          <input
            type="text"
            className="editor-filename-input"
            aria-label={t("editorFilenameLabel")}
            value={filename}
            placeholder={filenamePlaceholder}
            readOnly={filenameReadOnly}
            onChange={(event) => {
              onFilenameChange(event.target.value);
            }}
          />
        </div>
        <div className="editor-content-wrapper">
          <EditorContent editor={editor} />
        </div>
      </div>
    </section>
  );
}
