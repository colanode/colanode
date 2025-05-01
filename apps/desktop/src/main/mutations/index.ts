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
import { EmailVerifyMutationHandler } from '@/main/mutations/accounts/email-verify';
import { FieldCreateMutationHandler } from '@/main/mutations/databases/field-create';
import { FieldDeleteMutationHandler } from '@/main/mutations/databases/field-delete';
import { FieldNameUpdateMutationHandler } from '@/main/mutations/databases/field-name-update';
import { FileCreateMutationHandler } from '@/main/mutations/files/file-create';
import { FileDeleteMutationHandler } from '@/main/mutations/files/file-delete';
import { FileDownloadMutationHandler } from '@/main/mutations/files/file-download';
import { FileSaveTempMutationHandler } from '@/main/mutations/files/file-save-temp';
import { FolderCreateMutationHandler } from '@/main/mutations/folders/folder-create';
import { FolderUpdateMutationHandler } from '@/main/mutations/folders/folder-update';
import { FolderDeleteMutationHandler } from '@/main/mutations/folders/folder-delete';
import { MessageCreateMutationHandler } from '@/main/mutations/messages/message-create';
import { MessageDeleteMutationHandler } from '@/main/mutations/messages/message-delete';
import { NodeCollaboratorCreateMutationHandler } from '@/main/mutations/nodes/node-collaborator-create';
import { NodeCollaboratorDeleteMutationHandler } from '@/main/mutations/nodes/node-collaborator-delete';
import { NodeCollaboratorUpdateMutationHandler } from '@/main/mutations/nodes/node-collaborator-update';
import { NodeMarkOpenedMutationHandler } from '@/main/mutations/nodes/node-mark-opened';
import { NodeMarkSeenMutationHandler } from '@/main/mutations/nodes/node-mark-seen';
import { NodeReactionCreateMutationHandler } from '@/main/mutations/nodes/node-reaction-create';
import { NodeReactionDeleteMutationHandler } from '@/main/mutations/nodes/node-reaction-delete';
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
import { SpaceDescriptionUpdateMutationHandler } from '@/main/mutations/spaces/space-description-update';
import { SpaceAvatarUpdateMutationHandler } from '@/main/mutations/spaces/space-avatar-update';
import { SpaceNameUpdateMutationHandler } from '@/main/mutations/spaces/space-name-update';
import { ViewCreateMutationHandler } from '@/main/mutations/databases/view-create';
import { ViewDeleteMutationHandler } from '@/main/mutations/databases/view-delete';
import { ViewUpdateMutationHandler } from '@/main/mutations/databases/view-update';
import { ViewNameUpdateMutationHandler } from '@/main/mutations/databases/view-name-update';
import { WorkspaceCreateMutationHandler } from '@/main/mutations/workspaces/workspace-create';
import { WorkspaceUpdateMutationHandler } from '@/main/mutations/workspaces/workspace-update';
import { UserRoleUpdateMutationHandler } from '@/main/mutations/users/user-role-update';
import { UsersInviteMutationHandler } from '@/main/mutations/users/users-invite';
import { WorkspaceMetadataSaveMutationHandler } from '@/main/mutations/workspaces/workspace-metadata-save';
import { WorkspaceMetadataDeleteMutationHandler } from '@/main/mutations/workspaces/workspace-metadata-delete';
import { DocumentUpdateMutationHandler } from '@/main/mutations/documents/document-update';
import { AppMetadataSaveMutationHandler } from '@/main/mutations/apps/app-metadata-save';
import { AppMetadataDeleteMutationHandler } from '@/main/mutations/apps/app-metadata-delete';
import { AccountMetadataSaveMutationHandler } from '@/main/mutations/accounts/account-metadata-save';
import { AccountMetadataDeleteMutationHandler } from '@/main/mutations/accounts/account-metadata-delete';
import { EmailPasswordResetInitMutationHandler } from '@/main/mutations/accounts/email-password-reset-init';
import { EmailPasswordResetCompleteMutationHandler } from '@/main/mutations/accounts/email-password-reset-complete';
import { WorkspaceDeleteMutationHandler } from '@/main/mutations/workspaces/workspace-delete';
import { MutationHandler } from '@/main/lib/types';
import { MutationMap } from '@/shared/mutations';

type MutationHandlerMap = {
  [K in keyof MutationMap]: MutationHandler<MutationMap[K]['input']>;
};

export const mutationHandlerMap: MutationHandlerMap = {
  email_login: new EmailLoginMutationHandler(),
  email_register: new EmailRegisterMutationHandler(),
  email_verify: new EmailVerifyMutationHandler(),
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
  node_mark_opened: new NodeMarkOpenedMutationHandler(),
  node_mark_seen: new NodeMarkSeenMutationHandler(),
  page_create: new PageCreateMutationHandler(),
  page_delete: new PageDeleteMutationHandler(),
  node_reaction_create: new NodeReactionCreateMutationHandler(),
  node_reaction_delete: new NodeReactionDeleteMutationHandler(),
  message_delete: new MessageDeleteMutationHandler(),
  record_create: new RecordCreateMutationHandler(),
  record_delete: new RecordDeleteMutationHandler(),
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
  user_role_update: new UserRoleUpdateMutationHandler(),
  users_invite: new UsersInviteMutationHandler(),
  workspace_create: new WorkspaceCreateMutationHandler(),
  workspace_update: new WorkspaceUpdateMutationHandler(),
  avatar_upload: new AvatarUploadMutationHandler(),
  account_logout: new AccountLogoutMutationHandler(),
  folder_create: new FolderCreateMutationHandler(),
  file_create: new FileCreateMutationHandler(),
  file_download: new FileDownloadMutationHandler(),
  file_save_temp: new FileSaveTempMutationHandler(),
  space_avatar_update: new SpaceAvatarUpdateMutationHandler(),
  space_description_update: new SpaceDescriptionUpdateMutationHandler(),
  space_name_update: new SpaceNameUpdateMutationHandler(),
  account_update: new AccountUpdateMutationHandler(),
  view_update: new ViewUpdateMutationHandler(),
  view_delete: new ViewDeleteMutationHandler(),
  view_name_update: new ViewNameUpdateMutationHandler(),
  channel_update: new ChannelUpdateMutationHandler(),
  page_update: new PageUpdateMutationHandler(),
  folder_update: new FolderUpdateMutationHandler(),
  database_update: new DatabaseUpdateMutationHandler(),
  workspace_metadata_save: new WorkspaceMetadataSaveMutationHandler(),
  workspace_metadata_delete: new WorkspaceMetadataDeleteMutationHandler(),
  document_update: new DocumentUpdateMutationHandler(),
  app_metadata_save: new AppMetadataSaveMutationHandler(),
  app_metadata_delete: new AppMetadataDeleteMutationHandler(),
  account_metadata_save: new AccountMetadataSaveMutationHandler(),
  account_metadata_delete: new AccountMetadataDeleteMutationHandler(),
  email_password_reset_init: new EmailPasswordResetInitMutationHandler(),
  email_password_reset_complete:
    new EmailPasswordResetCompleteMutationHandler(),
  workspace_delete: new WorkspaceDeleteMutationHandler(),
};
