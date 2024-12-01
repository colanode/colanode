import { TaskList } from '@tiptap/extension-task-list';

import { defaultClasses } from '@/renderer/editor/classes';

export const TaskListNode = TaskList.configure({
  HTMLAttributes: {
    class: defaultClasses.taskList,
  },
});
