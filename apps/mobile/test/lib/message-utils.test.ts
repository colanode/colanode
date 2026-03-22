import { LocalMessageNode } from '@colanode/client/types/nodes';
import {
  getMessageText,
  getMessagePreview,
} from '@colanode/mobile/lib/message-utils';

const makeMessage = (
  content: LocalMessageNode['content']
): LocalMessageNode => {
  return {
    id: '01arr2r4ccr4sq8cgxk7qz33ms',
    rootId: 'root1',
    parentId: 'parent1',
    createdAt: '2024-01-01T00:00:00Z',
    createdBy: 'user1',
    updatedAt: null,
    updatedBy: null,
    localRevision: '1',
    serverRevision: '1',
    type: 'message',
    subtype: 'standard',
    name: undefined,
    content,
  } as LocalMessageNode;
};

const blockWithText = (id: string, text: string) => ({
  id,
  type: 'paragraph',
  parentId: 'root',
  index: 'a0',
  content: [{ type: 'text', text }],
});

describe('getMessageText', () => {
  it('should return empty string for message with no content', () => {
    expect(getMessageText(makeMessage(undefined))).toBe('');
    expect(getMessageText(makeMessage(null))).toBe('');
  });

  it('should extract text from a single block', () => {
    const msg = makeMessage({ b1: blockWithText('b1', 'Hello world') });
    expect(getMessageText(msg)).toBe('Hello world');
  });

  it('should join text from multiple blocks with newlines', () => {
    const msg = makeMessage({
      b1: blockWithText('b1', 'Line 1'),
      b2: blockWithText('b2', 'Line 2'),
    });
    expect(getMessageText(msg)).toBe('Line 1\nLine 2');
  });

  it('should skip blocks without text content', () => {
    const msg = makeMessage({
      b1: {
        id: 'b1',
        type: 'image',
        parentId: 'root',
        index: 'a0',
        content: null,
      },
      b2: blockWithText('b2', 'Text after image'),
    });
    expect(getMessageText(msg)).toBe('Text after image');
  });
});

describe('getMessagePreview', () => {
  it('should return (message) for empty content', () => {
    expect(getMessagePreview(makeMessage(undefined))).toBe('(message)');
    expect(getMessagePreview(makeMessage(null))).toBe('(message)');
  });

  it('should return preview from first block with text', () => {
    const msg = makeMessage({ b1: blockWithText('b1', 'Short text') });
    expect(getMessagePreview(msg)).toBe('Short text');
  });

  it('should truncate long previews', () => {
    const longText = 'A'.repeat(100);
    const msg = makeMessage({ b1: blockWithText('b1', longText) });
    const preview = getMessagePreview(msg);
    expect(preview.length).toBe(83); // 80 + "..."
    expect(preview.endsWith('...')).toBe(true);
  });

  it('should respect custom maxLength', () => {
    const msg = makeMessage({
      b1: blockWithText('b1', 'Hello wonderful world'),
    });
    const preview = getMessagePreview(msg, 10);
    expect(preview).toBe('Hello wond...');
  });

  it('should return (message) for blocks without text', () => {
    const msg = makeMessage({
      b1: {
        id: 'b1',
        type: 'divider',
        parentId: 'root',
        index: 'a0',
        content: [],
      },
    });
    expect(getMessagePreview(msg)).toBe('(message)');
  });
});
