import { EditorCommand } from '@/types/editor';
import { Code } from 'lucide-react';

export const CodeBlockCommand: EditorCommand = {
  key: 'code-block',
  name: 'Code',
  description: 'Insert a code block',
  keywords: ['code', 'codeblock'],
  icon: Code,
  disabled: false,
  handler: ({ editor, range }) => {
    editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
  },
};