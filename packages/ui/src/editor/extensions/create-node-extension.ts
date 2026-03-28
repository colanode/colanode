import { mergeAttributes, Node, type NodeViewProps } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import type { ComponentType } from 'react';

interface CreateNodeExtensionOptions {
  name: string;
  draggable: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  view: ComponentType<any>;
  attributes?: Record<string, { default: unknown }>;
}

export const createNodeExtension = ({
  name,
  draggable,
  view,
  attributes,
}: CreateNodeExtensionOptions) => {
  return Node.create({
    name,
    group: 'block',
    atom: true,
    defining: true,
    draggable,
    addAttributes() {
      return (
        attributes ?? {
          id: {
            default: null,
          },
        }
      );
    },
    renderHTML({ HTMLAttributes }) {
      return [name, mergeAttributes(HTMLAttributes)];
    },
    addNodeView() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return ReactNodeViewRenderer(view, { as: name }) as any;
    },
  });
};
