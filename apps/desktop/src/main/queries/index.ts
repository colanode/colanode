import { QueryMap } from '@/shared/queries';
import { QueryHandler } from '@/main/types';
import { AccountListQueryHandler } from '@/main/queries/accounts-list';
import { MessageListQueryHandler } from '@/main/queries/message-list';
import { NodeGetQueryHandler } from '@/main/queries/node-get';
import { ServerListQueryHandler } from '@/main/queries/server-list';
import { UserSearchQueryHandler } from '@/main/queries/user-search';
import { WorkspaceListQueryHandler } from '@/main/queries/workspace-list';
import { WorkspaceUserListQueryHandler } from '@/main/queries/workspace-user-list';
import { RecordListQueryHandler } from '@/main/queries/record-list';
import { FileListQueryHandler } from '@/main/queries/file-list';
import { EmojisGetQueryHandler } from '@/main/queries/emojis-get';
import { IconsGetQueryHandler } from '@/main/queries/icons-get';
import { NodeTreeGetQueryHandler } from '@/main/queries/node-tree-get';
import { NodeChildrenGetQueryHandler } from '@/main/queries/node-children-get';
import { RadarDataGetQueryHandler } from '@/main/queries/radar-data-get';
import { FileMetadataGetQueryHandler } from '@/main/queries/file-metadata-get';
import { AccountGetQueryHandler } from '@/main/queries/account-get';
import { WorkspaceGetQueryHandler } from '@/main/queries/workspace-get';

type QueryHandlerMap = {
  [K in keyof QueryMap]: QueryHandler<QueryMap[K]['input']>;
};

export const queryHandlerMap: QueryHandlerMap = {
  account_list: new AccountListQueryHandler(),
  message_list: new MessageListQueryHandler(),
  node_get: new NodeGetQueryHandler(),
  record_list: new RecordListQueryHandler(),
  server_list: new ServerListQueryHandler(),
  user_search: new UserSearchQueryHandler(),
  workspace_list: new WorkspaceListQueryHandler(),
  workspace_user_list: new WorkspaceUserListQueryHandler(),
  file_list: new FileListQueryHandler(),
  emojis_get: new EmojisGetQueryHandler(),
  icons_get: new IconsGetQueryHandler(),
  node_tree_get: new NodeTreeGetQueryHandler(),
  node_children_get: new NodeChildrenGetQueryHandler(),
  radar_data_get: new RadarDataGetQueryHandler(),
  file_metadata_get: new FileMetadataGetQueryHandler(),
  account_get: new AccountGetQueryHandler(),
  workspace_get: new WorkspaceGetQueryHandler(),
};
