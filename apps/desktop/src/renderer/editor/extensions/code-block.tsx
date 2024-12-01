import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { ReactNodeViewRenderer } from '@tiptap/react';

import { defaultClasses } from '@/renderer/editor/classes';
import { CodeBlockNodeView } from '@/renderer/editor/views';
import { lowlight } from '@/shared/lib/lowlight';

export const CodeBlockNode = CodeBlockLowlight.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockNodeView, {
      as: 'code-block',
    });
  },
}).configure({
  lowlight,
  defaultLanguage: 'plaintext',
  HTMLAttributes: {
    class: defaultClasses.codeBlock,
  },
});
