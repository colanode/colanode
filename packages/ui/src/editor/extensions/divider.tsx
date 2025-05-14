import { InputRule } from '@tiptap/core';
import { HorizontalRule } from '@tiptap/extension-horizontal-rule';

export const DividerNode = HorizontalRule.extend({
  addInputRules() {
    return [
      new InputRule({
        find: /^(?:---|—-|___\s|\*\*\*\s)$/,
        handler: ({ state, range }) => {
          const attributes = {};

          const { tr } = state;
          const start = range.from;
          const end = range.to;

          tr.insert(start - 1, this.type.create(attributes)).delete(
            tr.mapping.map(start),
            tr.mapping.map(end)
          );
        },
      }),
    ];
  },
}).configure({
  HTMLAttributes: {
    class:
      'h-0.5 my-2 cursor-pointer rounded-sm border-none bg-muted bg-clip-content',
  },
});
