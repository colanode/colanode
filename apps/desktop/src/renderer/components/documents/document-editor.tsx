import React from 'react';
import '@/renderer/styles/editor.css';
import { debounce } from 'lodash-es';
import { useEditor, EditorContent, JSONContent } from '@tiptap/react';
import {
  ParagraphCommand,
  BlockquoteCommand,
  Heading1Command,
  Heading2Command,
  Heading3Command,
  BulletListCommand,
  CodeBlockCommand,
  OrderedListCommand,
  DividerCommand,
  TodoCommand,
  PageCommand,
  FolderCommand,
  FileCommand,
} from '@/renderer/editor/commands';
import {
  IdExtension,
  DocumentNode,
  PageNode,
  FolderNode,
  FileNode,
  TextNode,
  ParagraphNode,
  Heading1Node,
  Heading2Node,
  Heading3Node,
  BlockquoteNode,
  BulletListNode,
  CodeBlockNode,
  TabKeymapExtension,
  ListItemNode,
  ListKeymapExtension,
  OrderedListNode,
  PlaceholderExtension,
  TaskListNode,
  TaskItemNode,
  CommanderExtension,
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
  DeleteControlExtension,
  DropcursorExtension,
} from '@/renderer/editor/extensions';
import { EditorBubbleMenu } from '@/renderer/editor/menu/bubble-menu';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useMutation } from '@/renderer/hooks/use-mutation';

interface DocumentEditorProps {
  documentId: string;
  content: JSONContent;
  transactionId: string;
  canEdit: boolean;
}

export const DocumentEditor = ({
  documentId,
  content,
  transactionId,
  canEdit,
}: DocumentEditorProps) => {
  const workspace = useWorkspace();
  const { mutate } = useMutation();

  const hasPendingChanges = React.useRef(false);
  const transactionIdRef = React.useRef(transactionId);
  const debouncedSave = React.useMemo(
    () =>
      debounce((content: JSONContent) => {
        hasPendingChanges.current = false;
        mutate({
          input: {
            type: 'document_save',
            documentId: documentId,
            userId: workspace.userId,
            content,
          },
        });
      }, 500),
    [mutate, documentId, workspace.userId]
  );

  const editor = useEditor(
    {
      extensions: [
        IdExtension,
        DocumentNode,
        PageNode,
        FolderNode,
        FileNode,
        TextNode,
        ParagraphNode,
        Heading1Node,
        Heading2Node,
        Heading3Node,
        BlockquoteNode,
        BulletListNode,
        CodeBlockNode,
        TabKeymapExtension,
        ListItemNode,
        ListKeymapExtension,
        OrderedListNode,
        PlaceholderExtension.configure({
          message: "Write something or '/' for commands",
        }),
        TaskListNode,
        TaskItemNode,
        DividerNode,
        TrailingNode,
        LinkMark,
        DeleteControlExtension,
        DropcursorExtension,
        CommanderExtension.configure({
          commands: [
            ParagraphCommand,
            PageCommand,
            BlockquoteCommand,
            Heading1Command,
            Heading2Command,
            Heading3Command,
            BulletListCommand,
            CodeBlockCommand,
            OrderedListCommand,
            DividerCommand,
            TodoCommand,
            FileCommand,
            FolderCommand,
          ],
          context: {
            documentId,
            userId: workspace.userId,
          },
        }),
        BoldMark,
        ItalicMark,
        UnderlineMark,
        StrikethroughMark,
        CodeMark,
        ColorMark,
        HighlightMark,
      ],
      editorProps: {
        attributes: {
          class:
            'prose-lg prose-stone dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-full',
          spellCheck: 'false',
        },
      },
      content: content,
      editable: canEdit,
      shouldRerenderOnTransaction: false,
      autofocus: 'start',
      onUpdate: async ({ editor, transaction }) => {
        if (transaction.docChanged) {
          hasPendingChanges.current = true;
          debouncedSave(editor.getJSON());
        }
      },
    },
    [documentId]
  );

  React.useEffect(() => {
    if (!editor) {
      return;
    }

    if (hasPendingChanges.current) {
      return;
    }

    if (transactionIdRef.current === transactionId) {
      return;
    }

    const selection = editor.state.selection;
    if (selection.$anchor != null && selection.$head != null) {
      editor.chain().setContent(content).setTextSelection(selection).run();
    } else {
      editor.chain().setContent(content).run();
    }

    transactionIdRef.current = transactionId;
  }, [content, transactionId]);

  return (
    <div className="min-h-[500px]">
      {editor && canEdit && (
        <React.Fragment>
          <EditorBubbleMenu editor={editor} />
        </React.Fragment>
      )}
      <EditorContent editor={editor} />
    </div>
  );
};
