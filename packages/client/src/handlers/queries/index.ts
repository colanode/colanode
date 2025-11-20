import { QueryHandler } from '@colanode/client/lib/types';
import { QueryMap } from '@colanode/client/queries';
import { AppService } from '@colanode/client/services/app-service';

import { AccountListQueryHandler } from './accounts/accounts-list';
import { MetadataListQueryHandler } from './apps/metadata-list';
import { TabsListQueryHandler } from './apps/tabs-list';
import { AvatarGetQueryHandler } from './avatars/avatar-get';
import { DocumentGetQueryHandler } from './documents/document-get';
import { DocumentStateGetQueryHandler } from './documents/document-state-get';
import { DocumentUpdatesListQueryHandler } from './documents/document-update-list';
import { EmojiCategoryListQueryHandler } from './emojis/emoji-category-list';
import { EmojiGetQueryHandler } from './emojis/emoji-get';
import { EmojiGetBySkinIdQueryHandler } from './emojis/emoji-get-by-skin-id';
import { EmojiListQueryHandler } from './emojis/emoji-list';
import { EmojiSearchQueryHandler } from './emojis/emoji-search';
import { EmojiSvgGetQueryHandler } from './emojis/emoji-svg-get';
import { DownloadListQueryHandler } from './files/download-list';
import { FileDownloadRequestGetQueryHandler } from './files/file-download-request-get';
import { LocalFileGetQueryHandler } from './files/local-file-get';
import { TempFileListQueryHandler } from './files/temp-file-list';
import { UploadListQueryHandler } from './files/upload-list';
import { IconCategoryListQueryHandler } from './icons/icon-category-list';
import { IconListQueryHandler } from './icons/icon-list';
import { IconSearchQueryHandler } from './icons/icon-search';
import { IconSvgGetQueryHandler } from './icons/icon-svg-get';
import { RadarDataGetQueryHandler } from './interactions/radar-data-get';
import { MessageListQueryHandler } from './messages/message-list';
import { NodeChildrenGetQueryHandler } from './nodes/node-children-get';
import { NodeGetQueryHandler } from './nodes/node-get';
import { NodeListQueryHandler } from './nodes/node-list';
import { NodeReactionsListQueryHandler } from './nodes/node-reaction-list';
import { NodeReactionsAggregateQueryHandler } from './nodes/node-reactions-aggregate';
import { NodeTreeGetQueryHandler } from './nodes/node-tree-get';
import { RecordFieldValueCountQueryHandler } from './records/record-field-value-count';
import { RecordListQueryHandler } from './records/record-list';
import { RecordSearchQueryHandler } from './records/record-search';
import { ServerListQueryHandler } from './servers/server-list';
import { UserListQueryHandler } from './users/user-list';
import { UserSearchQueryHandler } from './users/user-search';
import { WorkspaceListQueryHandler } from './workspaces/workspace-list';
import { WorkspaceStorageGetQueryHandler } from './workspaces/workspace-storage-get';
import { WorkspaceStorageUsersGetQueryHandler } from './workspaces/workspace-storage-users-get';

export type QueryHandlerMap = {
  [K in keyof QueryMap]: QueryHandler<QueryMap[K]['input']>;
};

export const buildQueryHandlerMap = (app: AppService): QueryHandlerMap => {
  return {
    'metadata.list': new MetadataListQueryHandler(app),
    'avatar.get': new AvatarGetQueryHandler(app),
    'account.list': new AccountListQueryHandler(app),
    'message.list': new MessageListQueryHandler(app),
    'node.reaction.list': new NodeReactionsListQueryHandler(app),
    'node.reactions.aggregate': new NodeReactionsAggregateQueryHandler(app),
    'node.get': new NodeGetQueryHandler(app),
    'node.list': new NodeListQueryHandler(app),
    'node.tree.get': new NodeTreeGetQueryHandler(app),
    'record.list': new RecordListQueryHandler(app),
    'record.field.value.count': new RecordFieldValueCountQueryHandler(app),
    'user.search': new UserSearchQueryHandler(app),
    'workspace.list': new WorkspaceListQueryHandler(app),
    'workspace.storage.get': new WorkspaceStorageGetQueryHandler(app),
    'workspace.storage.users.get': new WorkspaceStorageUsersGetQueryHandler(
      app
    ),
    'user.list': new UserListQueryHandler(app),
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
    'record.search': new RecordSearchQueryHandler(app),
    'local.file.get': new LocalFileGetQueryHandler(app),
    'file.download.request.get': new FileDownloadRequestGetQueryHandler(app),
    'document.get': new DocumentGetQueryHandler(app),
    'document.state.get': new DocumentStateGetQueryHandler(app),
    'document.updates.list': new DocumentUpdatesListQueryHandler(app),
    'upload.list': new UploadListQueryHandler(app),
    'download.list': new DownloadListQueryHandler(app),
    'temp.file.list': new TempFileListQueryHandler(app),
    'icon.svg.get': new IconSvgGetQueryHandler(app),
    'emoji.svg.get': new EmojiSvgGetQueryHandler(app),
    'tabs.list': new TabsListQueryHandler(app),
    'server.list': new ServerListQueryHandler(app),
  };
};
