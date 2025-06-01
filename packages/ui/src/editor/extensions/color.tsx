import { Mark } from '@tiptap/core';

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

          return {
            'data-color': attributes.color,
            class: `text-${attributes.color}-600`,
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
