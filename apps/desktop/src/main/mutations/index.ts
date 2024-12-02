import { PageContentUpdateMutationHandler } from '@/main/mutations/pages/page-content-update';
import { RecordContentUpdateMutationHandler } from '@/main/mutations/records/record-content-update';
import { AccountLogoutMutationHandler } from '@/main/mutations/accounts/account-logout';
import { AccountUpdateMutationHandler } from '@/main/mutations/accounts/account-update';
import { AvatarUploadMutationHandler } from '@/main/mutations/avatars/avatar-upload';
import { ChannelCreateMutationHandler } from '@/main/mutations/channels/channel-create';
import { ChannelUpdateMutationHandler } from '@/main/mutations/channels/channel-update';
import { ChannelDeleteMutationHandler } from '@/main/mutations/channels/channel-delete';
import { ChatCreateMutationHandler } from '@/main/mutations/chats/chat-create';
import { DatabaseCreateMutationHandler } from '@/main/mutations/databases/database-create';
import { DatabaseUpdateMutationHandler } from '@/main/mutations/databases/database-update';
import { DatabaseDeleteMutationHandler } from '@/main/mutations/databases/database-delete';
import { EmailLoginMutationHandler } from '@/main/mutations/accounts/email-login';
import { EmailRegisterMutationHandler } from '@/main/mutations/accounts/email-register';
import { FieldCreateMutationHandler } from '@/main/mutations/databases/field-create';
import { FieldDeleteMutationHandler } from '@/main/mutations/databases/field-delete';
import { FieldNameUpdateMutationHandler } from '@/main/mutations/databases/field-name-update';
import { FileCreateMutationHandler } from '@/main/mutations/files/file-create';
import { FileDeleteMutationHandler } from '@/main/mutations/files/file-delete';
import { FileDownloadMutationHandler } from '@/main/mutations/files/file-download';
import { FolderCreateMutationHandler } from '@/main/mutations/folders/folder-create';
import { FolderUpdateMutationHandler } from '@/main/mutations/folders/folder-update';
import { FolderDeleteMutationHandler } from '@/main/mutations/folders/folder-delete';
import { MarkNodeAsSeenMutationHandler } from '@/main/mutations/interactions/mark-node-as-seen';
import { MessageCreateMutationHandler } from '@/main/mutations/messages/message-create';
import { MessageDeleteMutationHandler } from '@/main/mutations/messages/message-delete';
import { NodeCollaboratorCreateMutationHandler } from '@/main/mutations/collaborators/node-collaborator-create';
import { NodeCollaboratorDeleteMutationHandler } from '@/main/mutations/collaborators/node-collaborator-delete';
import { NodeCollaboratorUpdateMutationHandler } from '@/main/mutations/collaborators/node-collaborator-update';
import { MessageReactionCreateMutationHandler } from '@/main/mutations/messages/message-reaction-create';
import { MessageReactionDeleteMutationHandler } from '@/main/mutations/messages/message-reaction-delete';
import { PageCreateMutationHandler } from '@/main/mutations/pages/page-create';
import { PageUpdateMutationHandler } from '@/main/mutations/pages/page-update';
import { PageDeleteMutationHandler } from '@/main/mutations/pages/page-delete';
import { RecordAvatarUpdateMutationHandler } from '@/main/mutations/records/record-avatar-update';
import { RecordCreateMutationHandler } from '@/main/mutations/records/record-create';
import { RecordDeleteMutationHandler } from '@/main/mutations/records/record-delete';
import { RecordFieldValueDeleteMutationHandler } from '@/main/mutations/records/record-field-value-delete';
import { RecordNameUpdateMutationHandler } from '@/main/mutations/records/record-name-update';
import { RecordFieldValueSetMutationHandler } from '@/main/mutations/records/record-field-value-set';
import { SelectOptionCreateMutationHandler } from '@/main/mutations/databases/select-option-create';
import { SelectOptionDeleteMutationHandler } from '@/main/mutations/databases/select-option-delete';
import { SelectOptionUpdateMutationHandler } from '@/main/mutations/databases/select-option-update';
import { ServerCreateMutationHandler } from '@/main/mutations/servers/server-create';
import { SpaceCreateMutationHandler } from '@/main/mutations/spaces/space-create';
import { SpaceDeleteMutationHandler } from '@/main/mutations/spaces/space-delete';
import { SpaceUpdateMutationHandler } from '@/main/mutations/spaces/space-update';
import { ViewCreateMutationHandler } from '@/main/mutations/databases/view-create';
import { ViewDeleteMutationHandler } from '@/main/mutations/databases/view-delete';
import { ViewUpdateMutationHandler } from '@/main/mutations/databases/view-update';
import { ViewNameUpdateMutationHandler } from '@/main/mutations/databases/view-name-update';
import { WorkspaceCreateMutationHandler } from '@/main/mutations/workspaces/workspace-create';
import { WorkspaceUpdateMutationHandler } from '@/main/mutations/workspaces/workspace-update';
import { WorkspaceUserRoleUpdateMutationHandler } from '@/main/mutations/workspaces/workspace-user-role-update';
import { WorkspaceUsersInviteMutationHandler } from '@/main/mutations/workspaces/workspace-users-invite';
import { MutationHandler } from '@/main/types';
import { MutationMap } from '@/shared/mutations';

type MutationHandlerMap = {
  [K in keyof MutationMap]: MutationHandler<MutationMap[K]['input']>;
};

export const mutationHandlerMap: MutationHandlerMap = {
  email_login: new EmailLoginMutationHandler(),
  email_register: new EmailRegisterMutationHandler(),
  view_create: new ViewCreateMutationHandler(),
  channel_create: new ChannelCreateMutationHandler(),
  channel_delete: new ChannelDeleteMutationHandler(),
  chat_create: new ChatCreateMutationHandler(),
  database_create: new DatabaseCreateMutationHandler(),
  database_delete: new DatabaseDeleteMutationHandler(),
  field_create: new FieldCreateMutationHandler(),
  field_delete: new FieldDeleteMutationHandler(),
  field_name_update: new FieldNameUpdateMutationHandler(),
  message_create: new MessageCreateMutationHandler(),
  file_delete: new FileDeleteMutationHandler(),
  folder_delete: new FolderDeleteMutationHandler(),
  node_collaborator_create: new NodeCollaboratorCreateMutationHandler(),
  node_collaborator_delete: new NodeCollaboratorDeleteMutationHandler(),
  node_collaborator_update: new NodeCollaboratorUpdateMutationHandler(),
  page_create: new PageCreateMutationHandler(),
  page_delete: new PageDeleteMutationHandler(),
  page_content_update: new PageContentUpdateMutationHandler(),
  message_reaction_create: new MessageReactionCreateMutationHandler(),
  message_reaction_delete: new MessageReactionDeleteMutationHandler(),
  message_delete: new MessageDeleteMutationHandler(),
  record_create: new RecordCreateMutationHandler(),
  record_delete: new RecordDeleteMutationHandler(),
  record_content_update: new RecordContentUpdateMutationHandler(),
  record_avatar_update: new RecordAvatarUpdateMutationHandler(),
  record_name_update: new RecordNameUpdateMutationHandler(),
  record_field_value_delete: new RecordFieldValueDeleteMutationHandler(),
  record_field_value_set: new RecordFieldValueSetMutationHandler(),
  select_option_create: new SelectOptionCreateMutationHandler(),
  select_option_delete: new SelectOptionDeleteMutationHandler(),
  select_option_update: new SelectOptionUpdateMutationHandler(),
  server_create: new ServerCreateMutationHandler(),
  space_create: new SpaceCreateMutationHandler(),
  space_delete: new SpaceDeleteMutationHandler(),
  workspace_user_role_update: new WorkspaceUserRoleUpdateMutationHandler(),
  workspace_users_invite: new WorkspaceUsersInviteMutationHandler(),
  workspace_create: new WorkspaceCreateMutationHandler(),
  workspace_update: new WorkspaceUpdateMutationHandler(),
  avatar_upload: new AvatarUploadMutationHandler(),
  account_logout: new AccountLogoutMutationHandler(),
  folder_create: new FolderCreateMutationHandler(),
  file_create: new FileCreateMutationHandler(),
  file_download: new FileDownloadMutationHandler(),
  space_update: new SpaceUpdateMutationHandler(),
  account_update: new AccountUpdateMutationHandler(),
  mark_node_as_seen: new MarkNodeAsSeenMutationHandler(),
  view_update: new ViewUpdateMutationHandler(),
  view_delete: new ViewDeleteMutationHandler(),
  view_name_update: new ViewNameUpdateMutationHandler(),
  channel_update: new ChannelUpdateMutationHandler(),
  page_update: new PageUpdateMutationHandler(),
  folder_update: new FolderUpdateMutationHandler(),
  database_update: new DatabaseUpdateMutationHandler(),
};
