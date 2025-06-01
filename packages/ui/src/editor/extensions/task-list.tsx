import { TaskList } from '@tiptap/extension-task-list';

import { defaultClasses } from '@colanode/ui/editor/classes';

export const TaskListNode = TaskList.configure({
  HTMLAttributes: {
    class: defaultClasses.taskList,
  },
});
