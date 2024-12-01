import { mergeAttributes, Node, textblockTypeInputRule } from '@tiptap/core';

import { defaultClasses } from '@/renderer/editor/classes';

export interface Heading2Options {
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    heading2: {
      /**
       * Set a heading2 node
       */
      setHeading2: () => ReturnType;
      /**
       * Toggle a heading2 node
       */
      toggleHeading2: () => ReturnType;
    };
  }
}

/**
 * This extension allows you to create h2 headings.
 */
export const Heading2Node = Node.create<Heading2Options>({
  name: 'heading2',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  content: 'inline*',

  group: 'block',

  defining: true,

  parseHTML() {
    return [{ tag: 'h2' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'h2',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: defaultClasses.heading2,
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setHeading2:
        () =>
        ({ commands }) => {
          return commands.setNode(this.name);
        },
      toggleHeading2:
        () =>
        ({ commands }) => {
          return commands.toggleNode(this.name, 'paragraph');
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Alt-2': () => this.editor.commands.toggleHeading2(),
    };
  },

  addInputRules() {
    return [
      textblockTypeInputRule({
        find: /^##\s$/,
        type: this.type,
      }),
    ];
  },
});
