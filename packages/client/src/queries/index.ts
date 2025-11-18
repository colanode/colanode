import { sha256 } from 'js-sha256';

export * from './accounts/account-list';
export * from './apps/metadata-list';
export * from './chats/chat-list';
export * from './databases/database-list';
export * from './databases/database-view-list';
export * from './documents/document-get';
export * from './documents/document-state-get';
export * from './documents/document-updates-list';
export * from './emojis/emoji-category-list';
export * from './emojis/emoji-get-by-skin-id';
export * from './emojis/emoji-get';
export * from './emojis/emoji-list';
export * from './emojis/emoji-search';
export * from './files/file-list';
export * from './files/local-file-get';
export * from './files/file-download-request-get';
export * from './icons/icon-category-list';
export * from './icons/icon-list';
export * from './icons/icon-search';
export * from './interactions/radar-data-get';
export * from './messages/message-list';
export * from './nodes/node-children-get';
export * from './nodes/node-get';
export * from './nodes/node-reaction-list';
export * from './nodes/node-reactions-aggregate';
export * from './nodes/node-tree-get';
export * from './records/record-list';
export * from './records/record-search';
export * from './spaces/space-list';
export * from './users/user-list';
export * from './users/user-search';
export * from './users/user-storage-get';
export * from './workspaces/workspace-list';
export * from './workspaces/workspace-storage-get';
export * from './workspaces/workspace-storage-users-get';
export * from './avatars/avatar-get';
export * from './records/record-field-value-count';
export * from './files/upload-list';
export * from './files/download-list';
export * from './files/temp-file-list';
export * from './icons/icon-svg-get';
export * from './emojis/emoji-svg-get';
export * from './apps/tabs-list';
export * from './servers/server-list';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface QueryMap {}

export type QueryInput = QueryMap[keyof QueryMap]['input'];

export class QueryError extends Error {
  constructor(
    public code: QueryErrorCode,
    message: string
  ) {
    super(message);
  }
}

export enum QueryErrorCode {
  Unknown = 'unknown',
  AccountNotFound = 'account_not_found',
  WorkspaceNotFound = 'workspace_not_found',
  ApiError = 'api_error',
}

export const buildQueryKey = <T extends QueryInput>(input: T): string => {
  const inputJson = JSON.stringify(input);
  const hash = sha256(inputJson);
  return hash;
};
