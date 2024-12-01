import { mergeAttributes, Node, textblockTypeInputRule } from '@tiptap/core';

import { defaultClasses } from '@/renderer/editor/classes';

export interface Heading1Options {
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    heading1: {
      /**
       * Set a heading1 node
       */
      setHeading1: () => ReturnType;
      /**
       * Toggle a heading1 node
       */
      toggleHeading1: () => ReturnType;
    };
  }
}

/**
 * This extension allows you to create h1 headings.
 */
export const Heading1Node = Node.create<Heading1Options>({
  name: 'heading1',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  content: 'inline*',

  group: 'block',

  defining: true,

  parseHTML() {
    return [{ tag: 'h1' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'h1',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: defaultClasses.heading1,
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setHeading1:
        () =>
        ({ commands }) => {
          return commands.setNode(this.name);
        },
      toggleHeading1:
        () =>
        ({ commands }) => {
          return commands.toggleNode(this.name, 'paragraph');
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Alt-1': () => this.editor.commands.toggleHeading1(),
    };
  },

  addInputRules() {
    return [
      textblockTypeInputRule({
        find: /^#\s$/,
        type: this.type,
      }),
    ];
  },
});
