import { WorkspaceRadarData } from '@colanode/client/types/radars';
import {
  getChatUnreadCount,
  getNodeUnreadCount,
  getUnreadSummary,
} from '@colanode/mobile/lib/radar-utils';

// IDs are ULID + 2-char type suffix. 'ct' = Chat, 'ch' = Channel.
const chatId = '01arr2r4ccr4sq8cgxk7qz33ct';
const chatId2 = '01arr2r4ccr4sq8cgxk7qz44ct';
const channelId = '01arr2r4ccr4sq8cgxk7qz55ch';

const userId = 'user1us';

const makeRadar = (
  nodeStates: Record<string, { hasUnread: boolean; unreadCount: number }>
): Record<string, WorkspaceRadarData> => ({
  [userId]: {
    userId,
    workspaceId: 'ws1',
    accountId: 'ac1',
    state: { hasUnread: false, unreadCount: 0 },
    nodeStates,
  },
});

describe('getChatUnreadCount', () => {
  it('should return 0 for undefined radar data', () => {
    expect(getChatUnreadCount(undefined, userId)).toBe(0);
  });

  it('should return 0 when user has no radar entry', () => {
    expect(getChatUnreadCount({}, userId)).toBe(0);
  });

  it('should count unread messages only in chat nodes', () => {
    const radar = makeRadar({
      [chatId]: { hasUnread: true, unreadCount: 5 },
      [channelId]: { hasUnread: true, unreadCount: 3 },
    });
    expect(getChatUnreadCount(radar, userId)).toBe(5);
  });

  it('should sum across multiple chats', () => {
    const radar = makeRadar({
      [chatId]: { hasUnread: true, unreadCount: 2 },
      [chatId2]: { hasUnread: true, unreadCount: 7 },
    });
    expect(getChatUnreadCount(radar, userId)).toBe(9);
  });

  it('should ignore chats with zero unread', () => {
    const radar = makeRadar({
      [chatId]: { hasUnread: false, unreadCount: 0 },
    });
    expect(getChatUnreadCount(radar, userId)).toBe(0);
  });
});

describe('getUnreadSummary', () => {
  it('should return zeros for undefined radar data', () => {
    expect(getUnreadSummary(undefined, userId)).toEqual({
      totalUnread: 0,
      unreadChats: 0,
    });
  });

  it('should count total unread across all node types', () => {
    const radar = makeRadar({
      [chatId]: { hasUnread: true, unreadCount: 3 },
      [channelId]: { hasUnread: true, unreadCount: 2 },
    });
    const result = getUnreadSummary(radar, userId);
    expect(result.totalUnread).toBe(5);
  });

  it('should count unread chats (not messages) separately', () => {
    const radar = makeRadar({
      [chatId]: { hasUnread: true, unreadCount: 10 },
      [chatId2]: { hasUnread: true, unreadCount: 5 },
      [channelId]: { hasUnread: true, unreadCount: 3 },
    });
    const result = getUnreadSummary(radar, userId);
    expect(result.unreadChats).toBe(2);
    expect(result.totalUnread).toBe(18);
  });
});

describe('getNodeUnreadCount', () => {
  it('should return 0 for undefined radar data', () => {
    expect(getNodeUnreadCount(undefined, userId, chatId)).toBe(0);
  });

  it('should return 0 for unknown node', () => {
    const radar = makeRadar({});
    expect(getNodeUnreadCount(radar, userId, 'nonexistent')).toBe(0);
  });

  it('should return unread count for a specific node', () => {
    const radar = makeRadar({
      [chatId]: { hasUnread: true, unreadCount: 42 },
    });
    expect(getNodeUnreadCount(radar, userId, chatId)).toBe(42);
  });
});
