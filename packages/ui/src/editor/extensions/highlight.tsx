import { Mark } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    highlight: {
      /**
       * Set a color mark
       */
      setHighlight: (color: string) => ReturnType;
      /**
       * Toggle a color mark
       */
      toggleHighlight: (color: string) => ReturnType;
      /**
       * Unset a color mark
       */
      unsetHighlight: () => ReturnType;
    };
  }
}

export const HighlightMark = Mark.create({
  name: 'highlight',
  keepOnSplit: false,
  addAttributes() {
    return {
      highlight: {
        default: null,
        parseHTML(element) {
          return {
            highlight: element.getAttribute('data-highlight'),
          };
        },
        renderHTML(attributes) {
          if (!attributes.highlight) {
            return {};
          }

          return {
            'data-highlight': attributes.highlight,
            class: `bg-${attributes.highlight}-200`,
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
      setHighlight:
        (highlight) =>
        ({ commands }) =>
          commands.setMark(this.name, { highlight }),
      toggleHighlight:
        (highlight) =>
        ({ commands }) =>
          commands.toggleMark(this.name, { highlight }),
      unsetHighlight:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    };
  },
});
