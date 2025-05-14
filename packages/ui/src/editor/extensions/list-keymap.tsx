import { ListKeymap } from '@tiptap/extension-list-keymap';

export const ListKeymapExtension = ListKeymap.configure({
  listTypes: [
    {
      itemName: 'listItem',
      wrapperNames: ['bulletList', 'orderedList'],
    },
    {
      itemName: 'taskItem',
      wrapperNames: ['taskList'],
    },
  ],
});
