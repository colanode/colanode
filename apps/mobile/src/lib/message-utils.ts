import { Block } from '@colanode/core';
import { LocalMessageNode } from '@colanode/client/types/nodes';

export const getMessageText = (message: LocalMessageNode): string => {
  const content = message.content;
  if (content && typeof content === 'object') {
    const blocks = Object.values(content) as Block[];
    const allTexts: string[] = [];
    for (const block of blocks) {
      if (block.content) {
        for (const child of block.content) {
          if (child.type === 'text' && child.text) {
            allTexts.push(child.text);
          }
        }
      }
    }
    return allTexts.join('\n');
  }
  return '';
};

export const getMessagePreview = (
  message: LocalMessageNode,
  maxLength = 80
): string => {
  const content = message.content;
  if (content && typeof content === 'object') {
    const blocks = Object.values(content) as Block[];
    for (const block of blocks) {
      if (block.content) {
        const texts: string[] = [];
        for (const child of block.content) {
          if (child.type === 'text' && child.text) {
            texts.push(child.text);
          }
        }
        if (texts.length > 0) {
          const preview = texts.join(' ');
          return preview.length > maxLength
            ? preview.slice(0, maxLength) + '...'
            : preview;
        }
      }
    }
  }
  return '(message)';
};
