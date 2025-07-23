import { TaskItem } from '@tiptap/extension-list';

import { defaultClasses } from '@colanode/ui/editor/classes';

export const TaskItemNode = TaskItem.configure({
  HTMLAttributes: {
    class: defaultClasses.taskItem,
  },
});
