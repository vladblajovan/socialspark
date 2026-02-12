"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import { TiptapToolbar } from "./tiptap-toolbar";
import { useEffect } from "react";

interface TiptapEditorProps {
  content?: string;
  onUpdate: (text: string, html: string) => void;
  placeholder?: string;
}

export function TiptapEditor({
  content,
  onUpdate,
  placeholder = "What's on your mind?",
}: TiptapEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        code: false,
        horizontalRule: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "tiptap-link" },
      }),
      Placeholder.configure({ placeholder }),
      CharacterCount,
    ],
    content: content || "",
    editorProps: {
      attributes: {
        class: "tiptap prose prose-sm focus:outline-none min-h-[200px] px-4 py-3",
      },
    },
    onUpdate: ({ editor: e }) => {
      onUpdate(e.getText(), e.getHTML());
    },
  });

  // Sync external content changes (e.g. loading from server)
  useEffect(() => {
    if (editor && content !== undefined && editor.getHTML() !== content) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
    // Only run when content prop changes externally
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  return (
    <div className="rounded-lg border bg-background">
      <TiptapToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
