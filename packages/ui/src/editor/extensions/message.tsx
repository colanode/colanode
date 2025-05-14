import { Node } from '@tiptap/core';

export const MessageNode = Node.create({
  name: 'message',
  topNode: true,
  content: 'block+',
});
