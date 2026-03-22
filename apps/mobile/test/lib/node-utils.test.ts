import { LocalNode } from '@colanode/client/types/nodes';
import {
  NODE_TYPE_LABELS,
  getNodeDisplayName,
} from '@colanode/mobile/lib/node-utils';

const makeNode = (overrides: Partial<LocalNode> & { type: string; name: string }) => {
  return {
    id: 'testid',
    rootId: 'root1',
    parentId: null,
    createdAt: '2024-01-01T00:00:00Z',
    createdBy: 'user1',
    updatedAt: null,
    updatedBy: null,
    localRevision: '1',
    serverRevision: '1',
    ...overrides,
  } as LocalNode;
};

describe('NODE_TYPE_LABELS', () => {
  it('should have labels for common node types', () => {
    expect(NODE_TYPE_LABELS['channel']).toBe('Channel');
    expect(NODE_TYPE_LABELS['page']).toBe('Page');
    expect(NODE_TYPE_LABELS['folder']).toBe('Folder');
    expect(NODE_TYPE_LABELS['database']).toBe('Database');
    expect(NODE_TYPE_LABELS['file']).toBe('File');
  });

  it('should return undefined for unknown types', () => {
    expect(NODE_TYPE_LABELS['unknown']).toBeUndefined();
  });
});

describe('getNodeDisplayName', () => {
  it('should return "Chat" for chat nodes', () => {
    const node = makeNode({ type: 'chat', name: 'some-name' });
    expect(getNodeDisplayName(node)).toBe('Chat');
  });

  it('should return node name or "Message" for message nodes', () => {
    const namedMsg = makeNode({ type: 'message', name: 'Re: topic' });
    expect(getNodeDisplayName(namedMsg)).toBe('Re: topic');

    const unnamedMsg = makeNode({ type: 'message', name: undefined as unknown as string });
    expect(getNodeDisplayName(unnamedMsg)).toBe('Message');
  });

  it('should return node name for other types', () => {
    const page = makeNode({ type: 'page', name: 'My Page' });
    expect(getNodeDisplayName(page)).toBe('My Page');

    const channel = makeNode({ type: 'channel', name: 'General' });
    expect(getNodeDisplayName(channel)).toBe('General');
  });
});
