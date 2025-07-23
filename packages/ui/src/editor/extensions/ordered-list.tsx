import { OrderedList } from '@tiptap/extension-list';

import { defaultClasses } from '@colanode/ui/editor/classes';

export const OrderedListNode = OrderedList.configure({
  HTMLAttributes: {
    class: defaultClasses.orderedList,
  },
});
