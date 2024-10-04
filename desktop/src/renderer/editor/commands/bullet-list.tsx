import { EditorCommand } from '@/types/editor';

export const BulletListCommand: EditorCommand = {
  key: 'bullet-list',
  name: 'Bullet List',
  description: 'Insert a bullet list',
  keywords: ['bulletlist', 'bullet', 'list'],
  icon: 'list-unordered',
  disabled: false,
  handler: ({ editor, range }) => {
    editor.chain().focus().deleteRange(range).toggleBulletList().run();
  },
};