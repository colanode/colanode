import { CommandProps, mergeAttributes, Node } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { ReactNodeViewRenderer } from '@tiptap/react';

import { FileMetadata } from '@colanode/client/types';
import { generateId, IdType } from '@colanode/core';
import { FilePlaceholderNodeView } from '@colanode/ui/editor/views';
import { toast } from '@colanode/ui/hooks/use-toast';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    filePlaceholder: {
      addFilePlaceholder: (metadata: FileMetadata) => ReturnType;
    };
  }
}

interface FilePlaceholderOptions {
  accountId: string;
  workspaceId: string;
}

export const FilePlaceholderNode = Node.create<FilePlaceholderOptions>({
  name: 'filePlaceholder',
  group: 'block',
  atom: true,
  defining: true,
  draggable: true,
  addAttributes() {
    return {
      id: {
        default: null,
      },
      path: {
        default: null,
      },
      extension: {
        default: null,
      },
      mimeType: {
        default: null,
      },
      type: {
        default: null,
      },
    };
  },
  renderHTML({ HTMLAttributes }) {
    return ['filePlaceholder', mergeAttributes(HTMLAttributes)];
  },
  addNodeView() {
    return ReactNodeViewRenderer(FilePlaceholderNodeView, {
      as: 'filePlaceholder',
    });
  },
  addCommands() {
    return {
      addFilePlaceholder:
        (metadata: FileMetadata) =>
        ({ editor, tr }: CommandProps) => {
          const pos = tr.selection.$head.pos;
          editor
            .chain()
            .focus()
            .insertContentAt(pos, {
              type: 'filePlaceholder',
              attrs: {
                id: generateId(IdType.FilePlaceholder),
                path: metadata.path,
                extension: metadata.extension,
                mimeType: metadata.mimeType,
                name: metadata.name,
                type: metadata.type,
              },
            })
            .run();

          return true;
        },
    };
  },
  addProseMirrorPlugins() {
    const editor = this.editor;
    const options = this.options;
    return [
      new Plugin({
        key: new PluginKey('file-placeholder-paste'),
        props: {
          handlePaste(_, event) {
            const files = Array.from(event.clipboardData?.files || []);
            if (files.length == 0) {
              return false;
            }

            (async () => {
              for (const file of files) {
                const buffer = await file.arrayBuffer();
                const fileSaveResult = await window.colanode.executeMutation({
                  type: 'file_save_temp',
                  name: file.name,
                  buffer,
                  accountId: options.accountId,
                  workspaceId: options.workspaceId,
                });

                if (!fileSaveResult.success) {
                  toast({
                    variant: 'destructive',
                    title: 'Failed to add file',
                    description: fileSaveResult.error.message,
                  });

                  return;
                }

                const path = fileSaveResult.output.path;
                const fileMetadata = await window.colanode.executeQuery({
                  type: 'file_metadata_get',
                  path: path,
                });

                if (fileMetadata === null) {
                  toast({
                    title: 'Failed to add file',
                    description:
                      'Something went wrong adding file. Please try again!',
                    variant: 'destructive',
                  });

                  return;
                }

                editor.commands.addFilePlaceholder(fileMetadata);
              }
            })();

            return true;
          },
        },
      }),
      new Plugin({
        key: new PluginKey('file-placeholder-drop'),
        props: {
          handleDrop(_, event) {
            const files = Array.from(event.dataTransfer?.files || []);
            if (files.length == 0) {
              return false;
            }

            (async () => {
              for (const file of files) {
                const buffer = await file.arrayBuffer();
                const fileSaveResult = await window.colanode.executeMutation({
                  type: 'file_save_temp',
                  name: file.name,
                  buffer,
                  accountId: options.accountId,
                  workspaceId: options.workspaceId,
                });

                if (!fileSaveResult.success) {
                  toast({
                    variant: 'destructive',
                    title: 'Failed to add file',
                    description: fileSaveResult.error.message,
                  });

                  return;
                }

                const path = fileSaveResult.output.path;
                const fileMetadata = await window.colanode.executeQuery({
                  type: 'file_metadata_get',
                  path: path,
                });

                if (fileMetadata === null) {
                  toast({
                    title: 'Failed to add file',
                    description:
                      'Something went wrong adding file. Please try again!',
                    variant: 'destructive',
                  });

                  return;
                }

                editor.commands.addFilePlaceholder(fileMetadata);
              }
            })();

            return true;
          },
        },
      }),
    ];
  },
});
