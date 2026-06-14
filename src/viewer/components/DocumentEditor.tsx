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
  sourceMarkdown,
  onSnapshotChange,
  onSaveRequest,
  onCancelRequest,
  isSaving,
}: DocumentEditorProps): React.JSX.Element {
  const parsed = React.useMemo(() => parseEditableMarkdown(sourceMarkdown), [sourceMarkdown]);
  const initialDocumentKey = React.useMemo(() => JSON.stringify(parsed.document), [parsed.document]);

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
    content: parsed.document,
    editorProps: {
      attributes: {
        class:
          "editor-surface [&_h1]:text-[2.5rem] [&_h1]:font-bold [&_h2]:text-[2rem] [&_h2]:font-bold [&_h3]:text-[1.5rem] [&_h3]:font-bold",
      },
    },
    onUpdate: ({ editor: nextEditor }) => {
      const document = nextEditor.getJSON() as MarkdownEditorDocument;
      onSnapshotChange(buildSnapshot(document, parsed.newlineStyle, parsed.hasTrailingNewline, initialDocumentKey));
    },
  });

  React.useEffect(() => {
    if (!editor) {
      return;
    }

    editor.commands.setContent(parsed.document);
    const snapshot = buildSnapshot(parsed.document, parsed.newlineStyle, parsed.hasTrailingNewline, initialDocumentKey);
    onSnapshotChange(snapshot);
  }, [editor, initialDocumentKey, onSnapshotChange, parsed.document, parsed.hasTrailingNewline, parsed.newlineStyle]);

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
    onSaveRequest(buildSnapshot(document, parsed.newlineStyle, parsed.hasTrailingNewline, initialDocumentKey));
  }, [editor, initialDocumentKey, onSaveRequest, parsed.hasTrailingNewline, parsed.newlineStyle]);

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
    return <p className="viewer-muted">エディタを準備しています...</p>;
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
        <div className="editor-content-wrapper">
          <EditorContent editor={editor} />
        </div>
      </div>
    </section>
  );
}
