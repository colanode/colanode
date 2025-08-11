import { ListItem } from '@tiptap/extension-list';

import { defaultClasses } from '@colanode/ui/editor/classes';

export const ListItemNode = ListItem.configure({
  HTMLAttributes: {
    class: defaultClasses.listItem,
  },
});
