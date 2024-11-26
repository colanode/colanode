import { MutationMap } from '@/shared/mutations';
import { MutationHandler } from '@/main/types';
import { EmailLoginMutationHandler } from '@/main/mutations/email-login';
import { EmailRegisterMutationHandler } from '@/main/mutations/email-register';
import { ViewCreateMutationHandler } from '@/main/mutations/view-create';
import { ChannelCreateMutationHandler } from '@/main/mutations/channel-create';
import { ChatCreateMutationHandler } from '@/main/mutations/chat-create';
import { DatabaseCreateMutationHandler } from '@/main/mutations/database-create';
import { FieldCreateMutationHandler } from '@/main/mutations/field-create';
import { MessageCreateMutationHandler } from '@/main/mutations/message-create';
import { NodeAttributeDeleteMutationHandler } from '@/main/mutations/node-attribute-delete';
import { NodeAttributeSetMutationHandler } from '@/main/mutations/node-attribute-set';
import { NodeCollaboratorCreateMutationHandler } from '@/main/mutations/node-collaborator-create';
import { NodeCollaboratorDeleteMutationHandler } from '@/main/mutations/node-collaborator-delete';
import { NodeCollaboratorUpdateMutationHandler } from '@/main/mutations/node-collaborator-update';
import { NodeDeleteMutationHandler } from '@/main/mutations/node-delete';
import { PageCreateMutationHandler } from '@/main/mutations/page-create';
import { NodeReactionCreateMutationHandler } from '@/main/mutations/node-reaction-create';
import { NodeReactionDeleteMutationHandler } from '@/main/mutations/node-reaction-delete';
import { RecordCreateMutationHandler } from '@/main/mutations/record-create';
import { SelectOptionCreateMutationHandler } from '@/main/mutations/select-option-create';
import { ServerCreateMutationHandler } from '@/main/mutations/server-create';
import { SpaceCreateMutationHandler } from '@/main/mutations/space-create';
import { WorkspaceUserRoleUpdateMutationHandler } from '@/main/mutations/workspace-user-role-update';
import { WorkspaceUsersInviteMutationHandler } from '@/main/mutations/workspace-users-invite';
import { WorkspaceCreateMutationHandler } from '@/main/mutations/workspace-create';
import { WorkspaceUpdateMutationHandler } from '@/main/mutations/workspace-update';
import { DocumentSaveMutationHandler } from '@/main/mutations/document-save';
import { AvatarUploadMutationHandler } from '@/main/mutations/avatar-upload';
import { AccountLogoutMutationHandler } from '@/main/mutations/account-logout';
import { FolderCreateMutationHandler } from '@/main/mutations/folder-create';
import { FileCreateMutationHandler } from '@/main/mutations/file-create';
import { FileDownloadMutationHandler } from '@/main/mutations/file-download';
import { SpaceUpdateMutationHandler } from '@/main/mutations/space-update';
import { AccountUpdateMutationHandler } from '@/main/mutations/account-update';
import { MarkNodeAsSeenMutationHandler } from '@/main/mutations/mark-node-as-seen';
import { ViewUpdateMutationHandler } from '@/main/mutations/view-update';
import { ViewDeleteMutationHandler } from '@/main/mutations/view-delete';
import { ChannelUpdateMutationHandler } from '@/main/mutations/channel-update';
import { PageUpdateMutationHandler } from '@/main/mutations/page-update';
import { FolderUpdateMutationHandler } from '@/main/mutations/folder-update';
import { DatabaseUpdateMutationHandler } from '@/main/mutations/database-update';

type MutationHandlerMap = {
  [K in keyof MutationMap]: MutationHandler<MutationMap[K]['input']>;
};

export const mutationHandlerMap: MutationHandlerMap = {
  email_login: new EmailLoginMutationHandler(),
  email_register: new EmailRegisterMutationHandler(),
  view_create: new ViewCreateMutationHandler(),
  channel_create: new ChannelCreateMutationHandler(),
  chat_create: new ChatCreateMutationHandler(),
  database_create: new DatabaseCreateMutationHandler(),
  field_create: new FieldCreateMutationHandler(),
  message_create: new MessageCreateMutationHandler(),
  node_attribute_delete: new NodeAttributeDeleteMutationHandler(),
  node_attribute_set: new NodeAttributeSetMutationHandler(),
  node_collaborator_create: new NodeCollaboratorCreateMutationHandler(),
  node_collaborator_delete: new NodeCollaboratorDeleteMutationHandler(),
  node_collaborator_update: new NodeCollaboratorUpdateMutationHandler(),
  node_delete: new NodeDeleteMutationHandler(),
  page_create: new PageCreateMutationHandler(),
  node_reaction_create: new NodeReactionCreateMutationHandler(),
  node_reaction_delete: new NodeReactionDeleteMutationHandler(),
  record_create: new RecordCreateMutationHandler(),
  select_option_create: new SelectOptionCreateMutationHandler(),
  server_create: new ServerCreateMutationHandler(),
  space_create: new SpaceCreateMutationHandler(),
  workspace_user_role_update: new WorkspaceUserRoleUpdateMutationHandler(),
  workspace_users_invite: new WorkspaceUsersInviteMutationHandler(),
  workspace_create: new WorkspaceCreateMutationHandler(),
  workspace_update: new WorkspaceUpdateMutationHandler(),
  document_save: new DocumentSaveMutationHandler(),
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
  channel_update: new ChannelUpdateMutationHandler(),
  page_update: new PageUpdateMutationHandler(),
  folder_update: new FolderUpdateMutationHandler(),
  database_update: new DatabaseUpdateMutationHandler(),
};
