import { QueryHandler } from '@colanode/client/lib/types';
import { QueryMap } from '@colanode/client/queries';
import { AppService } from '@colanode/client/services/app-service';

import { AccountGetQueryHandler } from './accounts/account-get';
import { AccountMetadataListQueryHandler } from './accounts/account-metadata-list';
import { AccountListQueryHandler } from './accounts/accounts-list';
import { AppMetadataListQueryHandler } from './apps/app-metadata-list';
import { AvatarGetQueryHandler } from './avatars/avatar-get';
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
import { EmojiSvgGetQueryHandler } from './emojis/emoji-svg-get';
import { DownloadListManualQueryHandler } from './files/download-list-manual';
import { FileDownloadRequestGetQueryHandler } from './files/file-download-request-get';
import { FileListQueryHandler } from './files/file-list';
import { LocalFileGetQueryHandler } from './files/local-file-get';
import { TempFileGetQueryHandler } from './files/temp-file-get';
import { UploadListQueryHandler } from './files/upload-list';
import { UploadListPendingQueryHandler } from './files/upload-list-pending';
import { IconCategoryListQueryHandler } from './icons/icon-category-list';
import { IconListQueryHandler } from './icons/icon-list';
import { IconSearchQueryHandler } from './icons/icon-search';
import { IconSvgGetQueryHandler } from './icons/icon-svg-get';
import { RadarDataGetQueryHandler } from './interactions/radar-data-get';
import { MessageListQueryHandler } from './messages/message-list';
import { NodeChildrenGetQueryHandler } from './nodes/node-children-get';
import { NodeGetQueryHandler } from './nodes/node-get';
import { NodeReactionsListQueryHandler } from './nodes/node-reaction-list';
import { NodeReactionsAggregateQueryHandler } from './nodes/node-reactions-aggregate';
import { NodeTreeGetQueryHandler } from './nodes/node-tree-get';
import { RecordFieldValueCountQueryHandler } from './records/record-field-value-count';
import { RecordListQueryHandler } from './records/record-list';
import { RecordSearchQueryHandler } from './records/record-search';
import { ServerListQueryHandler } from './servers/server-list';
import { SpaceListQueryHandler } from './spaces/space-list';
import { UserGetQueryHandler } from './users/user-get';
import { UserListQueryHandler } from './users/user-list';
import { UserSearchQueryHandler } from './users/user-search';
import { UserStorageGetQueryHandler } from './users/user-storage-get';
import { WorkspaceGetQueryHandler } from './workspaces/workspace-get';
import { WorkspaceListQueryHandler } from './workspaces/workspace-list';
import { WorkspaceMetadataListQueryHandler } from './workspaces/workspace-metadata-list';
import { WorkspaceStorageGetQueryHandler } from './workspaces/workspace-storage-get';

export type QueryHandlerMap = {
  [K in keyof QueryMap]: QueryHandler<QueryMap[K]['input']>;
};

export const buildQueryHandlerMap = (app: AppService): QueryHandlerMap => {
  return {
    'app.metadata.list': new AppMetadataListQueryHandler(app),
    'avatar.get': new AvatarGetQueryHandler(app),
    'account.list': new AccountListQueryHandler(app),
    'message.list': new MessageListQueryHandler(app),
    'node.reaction.list': new NodeReactionsListQueryHandler(app),
    'node.reactions.aggregate': new NodeReactionsAggregateQueryHandler(app),
    'node.get': new NodeGetQueryHandler(app),
    'node.tree.get': new NodeTreeGetQueryHandler(app),
    'record.list': new RecordListQueryHandler(app),
    'record.field.value.count': new RecordFieldValueCountQueryHandler(app),
    'server.list': new ServerListQueryHandler(app),
    'user.search': new UserSearchQueryHandler(app),
    'workspace.list': new WorkspaceListQueryHandler(app),
    'user.list': new UserListQueryHandler(app),
    'file.list': new FileListQueryHandler(app),
    'emoji.list': new EmojiListQueryHandler(app),
    'emoji.get': new EmojiGetQueryHandler(app),
    'emoji.get.by.skin.id': new EmojiGetBySkinIdQueryHandler(app),
    'emoji.category.list': new EmojiCategoryListQueryHandler(app),
    'emoji.search': new EmojiSearchQueryHandler(app),
    'icon.list': new IconListQueryHandler(app),
    'icon.search': new IconSearchQueryHandler(app),
    'icon.category.list': new IconCategoryListQueryHandler(app),
    'node.children.get': new NodeChildrenGetQueryHandler(app),
    'radar.data.get': new RadarDataGetQueryHandler(app),
    'account.get': new AccountGetQueryHandler(app),
    'workspace.get': new WorkspaceGetQueryHandler(app),
    'database.list': new DatabaseListQueryHandler(app),
    'database.view.list': new DatabaseViewListQueryHandler(app),
    'record.search': new RecordSearchQueryHandler(app),
    'user.get': new UserGetQueryHandler(app),
    'user.storage.get': new UserStorageGetQueryHandler(app),
    'local.file.get': new LocalFileGetQueryHandler(app),
    'file.download.request.get': new FileDownloadRequestGetQueryHandler(app),
    'chat.list': new ChatListQueryHandler(app),
    'space.list': new SpaceListQueryHandler(app),
    'workspace.metadata.list': new WorkspaceMetadataListQueryHandler(app),
    'document.get': new DocumentGetQueryHandler(app),
    'document.state.get': new DocumentStateGetQueryHandler(app),
    'document.updates.list': new DocumentUpdatesListQueryHandler(app),
    'account.metadata.list': new AccountMetadataListQueryHandler(app),
    'workspace.storage.get': new WorkspaceStorageGetQueryHandler(app),
    'upload.list': new UploadListQueryHandler(app),
    'upload.list.pending': new UploadListPendingQueryHandler(app),
    'download.list.manual': new DownloadListManualQueryHandler(app),
    'temp.file.get': new TempFileGetQueryHandler(app),
    'icon.svg.get': new IconSvgGetQueryHandler(app),
    'emoji.svg.get': new EmojiSvgGetQueryHandler(app),
  };
};
