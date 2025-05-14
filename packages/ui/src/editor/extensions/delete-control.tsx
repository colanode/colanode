import { Extension } from '@tiptap/core';

const specialBlocks = ['page', 'file', 'database'];

export const DeleteControlExtension = Extension.create({
  name: 'deleteControl',
  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor }) => {
        const { state } = editor;
        const { tr } = state;
        let result = false;
        state.doc.nodesBetween(
          tr.selection.$from.start(),
          tr.selection.$to.end(),
          (node) => {
            if (specialBlocks.includes(node.type.name)) {
              result = true;
            }
          }
        );
        return result;
      },
    };
  },
});
