import { Extension } from '@tiptap/core';

export const TabKeymapExtension = Extension.create({
  name: 'tabKeymap',
  addKeyboardShortcuts() {
    return {
      Tab: () => {
        return this.editor.commands.insertContent('\t');
      },
      'Shift-Tab': () => {
        const { tr, selection } = this.editor.view.state;
        const tabPosition = selection.$from.pos - 1;
        const textBetween = tr.doc.textBetween(tabPosition, tabPosition + 1);

        if (textBetween === '\t') {
          tr.delete(tabPosition, tabPosition + 1);
          this.editor.view.dispatch(tr);
          return true;
        }

        return false;
      },
    };
  },
});
