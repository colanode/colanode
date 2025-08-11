import { Mark } from '@tiptap/core';

import { editorColors } from '@colanode/ui/lib/editor';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    color: {
      /**
       * Set a color mark
       */
      setColor: (color: string) => ReturnType;
      /**
       * Toggle a color mark
       */
      toggleColor: (color: string) => ReturnType;
      /**
       * Unset a color mark
       */
      unsetColor: () => ReturnType;
    };
  }
}

export const ColorMark = Mark.create({
  name: 'color',
  keepOnSplit: false,
  addAttributes() {
    return {
      color: {
        default: null,
        parseHTML(element) {
          return {
            color: element.getAttribute('data-color'),
          };
        },
        renderHTML(attributes) {
          if (!attributes.color) {
            return {};
          }

          const value = attributes.color;
          const color = editorColors.find((editorColor) => {
            return editorColor.color === value;
          });

          return {
            'data-color': attributes.color,
            class: color?.textClass,
          };
        },
      },
    };
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', HTMLAttributes, 0];
  },
  addCommands() {
    return {
      setColor:
        (color) =>
        ({ commands }) =>
          commands.setMark(this.name, { color }),
      toggleColor:
        (color) =>
        ({ commands }) =>
          commands.toggleMark(this.name, { color }),
      unsetColor:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    };
  },
});
