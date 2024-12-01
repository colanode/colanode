import { mergeAttributes, Node, textblockTypeInputRule } from '@tiptap/core';

import { defaultClasses } from '@/renderer/editor/classes';

export interface Heading3Options {
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    heading3: {
      /**
       * Set a heading3 node
       */
      setHeading3: () => ReturnType;
      /**
       * Toggle a heading3 node
       */
      toggleHeading3: () => ReturnType;
    };
  }
}

/**
 * This extension allows you to create h3 headings.
 */
export const Heading3Node = Node.create<Heading3Options>({
  name: 'heading3',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  content: 'inline*',

  group: 'block',

  defining: true,

  parseHTML() {
    return [{ tag: 'h3' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'h3',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: defaultClasses.heading3,
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setHeading3:
        () =>
        ({ commands }) => {
          return commands.setNode(this.name);
        },
      toggleHeading3:
        () =>
        ({ commands }) => {
          return commands.toggleNode(this.name, 'paragraph');
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Alt-3': () => this.editor.commands.toggleHeading3(),
    };
  },

  addInputRules() {
    return [
      textblockTypeInputRule({
        find: /^###\s$/,
        type: this.type,
      }),
    ];
  },
});
