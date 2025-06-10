import type { JSONContent } from '@tiptap/core';
import { EditorContent, useEditor } from '@tiptap/react';
import isHotkey from 'is-hotkey';
import { forwardRef, Fragment, useImperativeHandle } from 'react';

import { TempFile } from '@colanode/client/types';
import {
  BoldMark,
  CodeBlockNode,
  CodeMark,
  ColorMark,
  DividerNode,
  DropcursorExtension,
  FileNode,
  TempFileNode,
  HighlightMark,
  IdExtension,
  ItalicMark,
  LinkMark,
  MessageNode,
  ParagraphNode,
  PlaceholderExtension,
  StrikethroughMark,
  TabKeymapExtension,
  TextNode,
  TrailingNode,
  UnderlineMark,
  MentionExtension,
} from '@colanode/ui/editor/extensions';
import { ToolbarMenu } from '@colanode/ui/editor/menus';

interface MessageEditorProps {
  accountId: string;
  workspaceId: string;
  conversationId: string;
  rootId: string;
  onChange?: (content: JSONContent) => void;
  onSubmit: () => void;
}

export interface MessageEditorRefProps {
  focus: () => void;
  clear: () => void;
  addTempFile: (file: TempFile) => void;
}

export const MessageEditor = forwardRef<
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
        TempFileNode,
        FileNode,
        MentionExtension.configure({
          context: {
            accountId: props.accountId,
            workspaceId: props.workspaceId,
            documentId: props.conversationId,
            rootId: props.rootId,
          },
        }),
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

  useImperativeHandle(ref, () => ({
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
    addTempFile: (file: TempFile) => {
      if (editor == null) {
        return;
      }

      editor.chain().focus().addTempFile(file).run();
    },
  }));

  if (editor == null) {
    return null;
  }

  return (
    <Fragment>
      <ToolbarMenu editor={editor} />
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
    </Fragment>
  );
});

MessageEditor.displayName = 'MessageEditor';
