import { mergeAttributes, Node } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { toast } from 'sonner';

import { EditorContext, TempFile } from '@colanode/client/types';
import { FileNodeView } from '@colanode/ui/editor/views';

interface FileNodeOptions {
  context: EditorContext;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    file: {
      /**
       * Insert a file
       */
      addFile: (file: TempFile) => ReturnType;
    };
  }
}

export const FileNode = Node.create<FileNodeOptions>({
  name: 'file',
  group: 'block',
  atom: true,
  defining: true,
  draggable: true,
  addAttributes() {
    return {
      id: {
        default: null,
      },
    };
  },
  renderHTML({ HTMLAttributes }) {
    return ['file', mergeAttributes(HTMLAttributes)];
  },
  addNodeView() {
    return ReactNodeViewRenderer(FileNodeView, {
      as: 'file',
    });
  },
  addCommands() {
    const options = this.options;
    return {
      addFile: (file: TempFile) => {
        return ({ editor, tr }) => {
          (async () => {
            const fileCreateResult = await window.colanode.executeMutation({
              type: 'file.create',
              file,
              accountId: options.context.accountId,
              workspaceId: options.context.workspaceId,
              parentId: options.context.documentId,
            });

            if (!fileCreateResult.success) {
              toast.error(fileCreateResult.error.message);
              return;
            }

            const fileId = fileCreateResult.output.id;
            const pos = tr.selection.$head.pos;
            editor
              .chain()
              .focus()
              .insertContentAt(pos, {
                type: 'file',
                attrs: {
                  id: fileId,
                },
              })
              .run();
          })();

          return true;
        };
      },
    };
  },
  addProseMirrorPlugins() {
    const editor = this.editor;
    const options = this.options;

    if (!options.context) {
      return [];
    }

    return [
      new Plugin({
        key: new PluginKey('file-paste'),
        props: {
          handlePaste(_, event) {
            const files = Array.from(event.clipboardData?.files || []);
            if (files.length == 0) {
              return false;
            }

            (async () => {
              for (const file of files) {
                const tempFile = await window.colanode.saveTempFile(file);
                editor.commands.addFile(tempFile);
              }
            })();

            return true;
          },
        },
      }),
      new Plugin({
        key: new PluginKey('file-drop'),
        props: {
          handleDrop(_, event) {
            const files = Array.from(event.dataTransfer?.files || []);
            if (files.length == 0) {
              return false;
            }

            (async () => {
              for (const file of files) {
                const tempFile = await window.colanode.saveTempFile(file);
                editor.commands.addFile(tempFile);
              }
            })();

            return true;
          },
        },
      }),
    ];
  },
});
