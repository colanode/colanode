import { mergeAttributes, Node, CommandProps } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { FilePlaceholderNodeView } from '@/renderer/editor/views';
import { FileMetadata } from '@/types/files';
import { generateId, IdType } from '@/lib/id';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    filePlaceholder: {
      addFilePlaceholder: (metadata: FileMetadata) => ReturnType;
    };
  }
}

export const FilePlaceholderNode = Node.create({
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
        ({ chain }: CommandProps) => {
          return chain()
            .focus()
            .insertContent({
              type: 'filePlaceholder',
              attrs: {
                id: generateId(IdType.FilePlaceholder),
                path: metadata.path,
                extension: metadata.extension,
                mimeType: metadata.mimeType,
                name: metadata.name,
              },
            })
            .run();
        },
    };
  },
});