import { ListItem } from '@tiptap/extension-list-item';

import { defaultClasses } from '@colanode/ui/editor/classes';

export const ListItemNode = ListItem.configure({
  HTMLAttributes: {
    class: defaultClasses.listItem,
  },
});
