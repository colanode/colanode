import React from 'react';
import type { JSONContent } from '@tiptap/core';
import { EditorContent, useEditor } from '@tiptap/react';
import isHotkey from 'is-hotkey';
import {
  MessageNode,
  TextNode,
  ParagraphNode,
  CodeBlockNode,
  TabKeymapExtension,
  PlaceholderExtension,
  DividerNode,
  TrailingNode,
  BoldMark,
  ItalicMark,
  UnderlineMark,
  StrikethroughMark,
  CodeMark,
  ColorMark,
  HighlightMark,
  LinkMark,
  IdExtension,
  DropcursorExtension,
  FilePlaceholderNode,
  FileNode,
} from '@/renderer/editor/extensions';
import { EditorBubbleMenu } from '@/renderer/editor/menu/bubble-menu';
import { FileMetadata } from '@/shared/types/files';

interface MessageEditorProps {
  conversationId: string;
  onChange?: (content: JSONContent) => void;
  onSubmit: () => void;
}

export interface MessageEditorRefProps {
  focus: () => void;
  clear: () => void;
  addFile: (file: FileMetadata) => void;
}

export const MessageEditor = React.forwardRef<
  MessageEditorRefProps,
  MessageEditorProps
>((props, ref) => {
  const editor = useEditor(
    {
      extensions: [
        IdExtension,
        MessageNode,
        TextNode,
        ParagraphNode,
        CodeBlockNode,
        TabKeymapExtension,
        PlaceholderExtension.configure({
          message: 'Write a message',
        }),
        DividerNode,
        TrailingNode,
        BoldMark,
        ItalicMark,
        UnderlineMark,
        StrikethroughMark,
        CodeMark,
        ColorMark,
        HighlightMark,
        LinkMark,
        DropcursorExtension,
        FilePlaceholderNode,
        FileNode,
      ],
      editorProps: {
        attributes: {
          class:
            'prose-lg prose-stone dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-full',
        },
        handleKeyDown: (_, event) => {
          return isHotkey('enter', event);
        },
      },
      onUpdate: (e) => {
        props.onChange?.(e.editor.getJSON());
      },
      autofocus: 'end',
    },
    [props.conversationId]
  );

  React.useImperativeHandle(ref, () => ({
    focus: () => {
      if (editor == null) {
        return;
      }

      editor.chain().focus('end').run();
      editor?.view?.focus();
    },
    clear: () => {
      if (editor == null) {
        return;
      }

      editor.chain().clearContent(true).focus().run();
    },
    addFile: (file: FileMetadata) => {
      if (editor == null) {
        return;
      }

      editor.chain().focus().addFilePlaceholder(file).run();
    },
  }));

  if (editor == null) {
    return null;
  }

  return (
    <React.Fragment>
      <EditorBubbleMenu editor={editor} />
      <EditorContent
        editor={editor}
        onKeyDown={(event) => {
          if (editor == null) {
            return false;
          }

          if (isHotkey('enter', event)) {
            if (editor.storage?.mention?.isOpen) {
              return false;
            }

            event.preventDefault();
            event.stopPropagation();
            props.onSubmit();
            return true;
          }

          return false;
        }}
      />
    </React.Fragment>
  );
});

MessageEditor.displayName = 'MessageEditor';
