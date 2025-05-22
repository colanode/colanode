import { QueryHandler } from '@colanode/client/lib/types';
import { QueryMap } from '@colanode/client/queries';
import { AppService } from '@colanode/client/services/app-service';

import { AccountGetQueryHandler } from './accounts/account-get';
import { AccountMetadataListQueryHandler } from './accounts/account-metadata-list';
import { AccountListQueryHandler } from './accounts/accounts-list';
import { AppMetadataListQueryHandler } from './apps/app-metadata-list';
import { AvatarUrlGetQueryHandler } from './avatars/avatar-url-get';
import { ChatListQueryHandler } from './chats/chat-list';
import { DatabaseListQueryHandler } from './databases/database-list';
import { DatabaseViewListQueryHandler } from './databases/database-view-list';
import { DocumentGetQueryHandler } from './documents/document-get';
import { DocumentStateGetQueryHandler } from './documents/document-state-get';
import { DocumentUpdatesListQueryHandler } from './documents/document-update-list';
import { EmojiCategoryListQueryHandler } from './emojis/emoji-category-list';
import { EmojiGetQueryHandler } from './emojis/emoji-get';
import { EmojiGetBySkinIdQueryHandler } from './emojis/emoji-get-by-skin-id';
import { EmojiListQueryHandler } from './emojis/emoji-list';
import { EmojiSearchQueryHandler } from './emojis/emoji-search';
import { FileListQueryHandler } from './files/file-list';
import { FileStateGetQueryHandler } from './files/file-state-get';
import { FileUrlGetQueryHandler } from './files/file-url-get';
import { IconCategoryListQueryHandler } from './icons/icon-category-list';
import { IconListQueryHandler } from './icons/icon-list';
import { IconSearchQueryHandler } from './icons/icon-search';
import { RadarDataGetQueryHandler } from './interactions/radar-data-get';
import { MessageListQueryHandler } from './messages/message-list';
import { NodeChildrenGetQueryHandler } from './nodes/node-children-get';
import { NodeGetQueryHandler } from './nodes/node-get';
import { NodeReactionsListQueryHandler } from './nodes/node-reaction-list';
import { NodeReactionsAggregateQueryHandler } from './nodes/node-reactions-aggregate';
import { NodeTreeGetQueryHandler } from './nodes/node-tree-get';
import { RecordListQueryHandler } from './records/record-list';
import { RecordSearchQueryHandler } from './records/record-search';
import { ServerListQueryHandler } from './servers/server-list';
import { SpaceListQueryHandler } from './spaces/space-list';
import { UserGetQueryHandler } from './users/user-get';
import { UserListQueryHandler } from './users/user-list';
import { UserSearchQueryHandler } from './users/user-search';
import { WorkspaceGetQueryHandler } from './workspaces/workspace-get';
import { WorkspaceListQueryHandler } from './workspaces/workspace-list';
import { WorkspaceMetadataListQueryHandler } from './workspaces/workspace-metadata-list';

export type QueryHandlerMap = {
  [K in keyof QueryMap]: QueryHandler<QueryMap[K]['input']>;
};

export const buildQueryHandlerMap = (app: AppService): QueryHandlerMap => {
  return {
    app_metadata_list: new AppMetadataListQueryHandler(app),
    avatar_url_get: new AvatarUrlGetQueryHandler(app),
    account_list: new AccountListQueryHandler(app),
    message_list: new MessageListQueryHandler(app),
    node_reaction_list: new NodeReactionsListQueryHandler(app),
    node_reactions_aggregate: new NodeReactionsAggregateQueryHandler(app),
    node_get: new NodeGetQueryHandler(app),
    node_tree_get: new NodeTreeGetQueryHandler(app),
    record_list: new RecordListQueryHandler(app),
    server_list: new ServerListQueryHandler(app),
    user_search: new UserSearchQueryHandler(app),
    workspace_list: new WorkspaceListQueryHandler(app),
    user_list: new UserListQueryHandler(app),
    file_list: new FileListQueryHandler(app),
    file_url_get: new FileUrlGetQueryHandler(app),
    emoji_list: new EmojiListQueryHandler(app),
    emoji_get: new EmojiGetQueryHandler(app),
    emoji_get_by_skin_id: new EmojiGetBySkinIdQueryHandler(app),
    emoji_category_list: new EmojiCategoryListQueryHandler(app),
    emoji_search: new EmojiSearchQueryHandler(app),
    icon_list: new IconListQueryHandler(app),
    icon_search: new IconSearchQueryHandler(app),
    icon_category_list: new IconCategoryListQueryHandler(app),
    node_children_get: new NodeChildrenGetQueryHandler(app),
    radar_data_get: new RadarDataGetQueryHandler(app),
    account_get: new AccountGetQueryHandler(app),
    workspace_get: new WorkspaceGetQueryHandler(app),
    database_list: new DatabaseListQueryHandler(app),
    database_view_list: new DatabaseViewListQueryHandler(app),
    record_search: new RecordSearchQueryHandler(app),
    user_get: new UserGetQueryHandler(app),
    file_state_get: new FileStateGetQueryHandler(app),
    chat_list: new ChatListQueryHandler(app),
    space_list: new SpaceListQueryHandler(app),
    workspace_metadata_list: new WorkspaceMetadataListQueryHandler(app),
    document_get: new DocumentGetQueryHandler(app),
    document_state_get: new DocumentStateGetQueryHandler(app),
    document_updates_list: new DocumentUpdatesListQueryHandler(app),
    account_metadata_list: new AccountMetadataListQueryHandler(app),
  };
};
