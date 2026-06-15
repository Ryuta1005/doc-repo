import React from "react";
import type { Editor } from "@tiptap/react";
import type {} from "@tiptap/starter-kit";

import { matchesEditorShortcut } from "../shortcuts/editorShortcuts.js";

interface UseEditorShortcutsOptions {
  editor: Editor | null;
  onSave: () => void;
}

const isEditableShortcutTarget = (event: KeyboardEvent, editorRoot: HTMLElement): boolean => {
  const target = event.target;
  return target instanceof Node && editorRoot.contains(target);
};

export const useEditorShortcuts = ({ editor, onSave }: UseEditorShortcutsOptions): void => {
  React.useEffect(() => {
    if (!editor) {
      return;
    }

    const handleEditorShortcut = (event: KeyboardEvent): void => {
      if (event.defaultPrevented) {
        return;
      }

      if (matchesEditorShortcut(event, "save")) {
        event.preventDefault();
        onSave();
        return;
      }

      const editorRoot = editor.view.dom;
      if (!isEditableShortcutTarget(event, editorRoot)) {
        return;
      }

      if (matchesEditorShortcut(event, "bold")) {
        event.preventDefault();
        editor.chain().focus().toggleBold().run();
        return;
      }

      if (matchesEditorShortcut(event, "italic")) {
        event.preventDefault();
        editor.chain().focus().toggleItalic().run();
        return;
      }

      if (matchesEditorShortcut(event, "strike")) {
        event.preventDefault();
        editor.chain().focus().toggleStrike().run();
        return;
      }

      if (matchesEditorShortcut(event, "code")) {
        event.preventDefault();
        editor.chain().focus().toggleCode().run();
        return;
      }

      if (matchesEditorShortcut(event, "blockquote")) {
        event.preventDefault();
        editor.chain().focus().toggleBlockquote().run();
        return;
      }

      if (matchesEditorShortcut(event, "bulletList")) {
        event.preventDefault();
        editor.chain().focus().toggleBulletList().run();
        return;
      }

      if (matchesEditorShortcut(event, "orderedList")) {
        event.preventDefault();
        editor.chain().focus().toggleOrderedList().run();
        return;
      }

      if (matchesEditorShortcut(event, "codeBlock")) {
        event.preventDefault();
        editor.chain().focus().toggleCodeBlock().run();
        return;
      }

      if (matchesEditorShortcut(event, "horizontalRule")) {
        event.preventDefault();
        editor.chain().focus().setHorizontalRule().run();
        return;
      }

      if (matchesEditorShortcut(event, "paragraph")) {
        event.preventDefault();
        editor.chain().focus().setParagraph().run();
        return;
      }

      for (const level of [1, 2, 3, 4, 5, 6] as const) {
        if (matchesEditorShortcut(event, `h${level}`)) {
          event.preventDefault();
          editor.chain().focus().toggleHeading({ level }).run();
          return;
        }
      }
    };

    document.addEventListener("keydown", handleEditorShortcut, { capture: true });
    return () => {
      document.removeEventListener("keydown", handleEditorShortcut, { capture: true });
    };
  }, [editor, onSave]);
};
