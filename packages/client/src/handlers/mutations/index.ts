import { MutationHandler } from '@colanode/client/lib';
import { MutationMap } from '@colanode/client/mutations';
import { AppService } from '@colanode/client/services';

import { AccountLogoutMutationHandler } from './accounts/account-logout';
import { AccountMetadataDeleteMutationHandler } from './accounts/account-metadata-delete';
import { AccountMetadataSaveMutationHandler } from './accounts/account-metadata-save';
import { AccountUpdateMutationHandler } from './accounts/account-update';
import { EmailLoginMutationHandler } from './accounts/email-login';
import { EmailPasswordResetCompleteMutationHandler } from './accounts/email-password-reset-complete';
import { EmailPasswordResetInitMutationHandler } from './accounts/email-password-reset-init';
import { EmailRegisterMutationHandler } from './accounts/email-register';
import { EmailVerifyMutationHandler } from './accounts/email-verify';
import { AppMetadataDeleteMutationHandler } from './apps/app-metadata-delete';
import { AppMetadataSaveMutationHandler } from './apps/app-metadata-save';
import { AvatarUploadMutationHandler } from './avatars/avatar-upload';
import { ChannelCreateMutationHandler } from './channels/channel-create';
import { ChannelDeleteMutationHandler } from './channels/channel-delete';
import { ChannelUpdateMutationHandler } from './channels/channel-update';
import { ChatCreateMutationHandler } from './chats/chat-create';
import { DatabaseCreateMutationHandler } from './databases/database-create';
import { DatabaseDeleteMutationHandler } from './databases/database-delete';
import { DatabaseUpdateMutationHandler } from './databases/database-update';
import { FieldCreateMutationHandler } from './databases/field-create';
import { FieldDeleteMutationHandler } from './databases/field-delete';
import { FieldNameUpdateMutationHandler } from './databases/field-name-update';
import { SelectOptionCreateMutationHandler } from './databases/select-option-create';
import { SelectOptionDeleteMutationHandler } from './databases/select-option-delete';
import { SelectOptionUpdateMutationHandler } from './databases/select-option-update';
import { ViewCreateMutationHandler } from './databases/view-create';
import { ViewDeleteMutationHandler } from './databases/view-delete';
import { ViewNameUpdateMutationHandler } from './databases/view-name-update';
import { ViewUpdateMutationHandler } from './databases/view-update';
import { DocumentUpdateMutationHandler } from './documents/document-update';
import { FileCreateMutationHandler } from './files/file-create';
import { FileDeleteMutationHandler } from './files/file-delete';
import { FileDownloadMutationHandler } from './files/file-download';
import { FileSaveTempMutationHandler } from './files/file-save-temp';
import { FolderCreateMutationHandler } from './folders/folder-create';
import { FolderDeleteMutationHandler } from './folders/folder-delete';
import { FolderUpdateMutationHandler } from './folders/folder-update';
import { MessageCreateMutationHandler } from './messages/message-create';
import { MessageDeleteMutationHandler } from './messages/message-delete';
import { NodeCollaboratorCreateMutationHandler } from './nodes/node-collaborator-create';
import { NodeCollaboratorDeleteMutationHandler } from './nodes/node-collaborator-delete';
import { NodeCollaboratorUpdateMutationHandler } from './nodes/node-collaborator-update';
import { NodeMarkOpenedMutationHandler } from './nodes/node-mark-opened';
import { NodeMarkSeenMutationHandler } from './nodes/node-mark-seen';
import { NodeReactionCreateMutationHandler } from './nodes/node-reaction-create';
import { NodeReactionDeleteMutationHandler } from './nodes/node-reaction-delete';
import { PageCreateMutationHandler } from './pages/page-create';
import { PageDeleteMutationHandler } from './pages/page-delete';
import { PageUpdateMutationHandler } from './pages/page-update';
import { RecordAvatarUpdateMutationHandler } from './records/record-avatar-update';
import { RecordCreateMutationHandler } from './records/record-create';
import { RecordDeleteMutationHandler } from './records/record-delete';
import { RecordFieldValueDeleteMutationHandler } from './records/record-field-value-delete';
import { RecordFieldValueSetMutationHandler } from './records/record-field-value-set';
import { RecordNameUpdateMutationHandler } from './records/record-name-update';
import { ServerCreateMutationHandler } from './servers/server-create';
import { SpaceAvatarUpdateMutationHandler } from './spaces/space-avatar-update';
import { SpaceCreateMutationHandler } from './spaces/space-create';
import { SpaceDeleteMutationHandler } from './spaces/space-delete';
import { SpaceDescriptionUpdateMutationHandler } from './spaces/space-description-update';
import { SpaceNameUpdateMutationHandler } from './spaces/space-name-update';
import { UserRoleUpdateMutationHandler } from './users/user-role-update';
import { UsersInviteMutationHandler } from './users/users-invite';
import { WorkspaceCreateMutationHandler } from './workspaces/workspace-create';
import { WorkspaceDeleteMutationHandler } from './workspaces/workspace-delete';
import { WorkspaceMetadataDeleteMutationHandler } from './workspaces/workspace-metadata-delete';
import { WorkspaceMetadataSaveMutationHandler } from './workspaces/workspace-metadata-save';
import { WorkspaceUpdateMutationHandler } from './workspaces/workspace-update';

export type MutationHandlerMap = {
  [K in keyof MutationMap]: MutationHandler<MutationMap[K]['input']>;
};

export const buildMutationHandlerMap = (
  app: AppService
): MutationHandlerMap => {
  return {
    email_login: new EmailLoginMutationHandler(app),
    email_register: new EmailRegisterMutationHandler(app),
    email_verify: new EmailVerifyMutationHandler(app),
    view_create: new ViewCreateMutationHandler(app),
    channel_create: new ChannelCreateMutationHandler(app),
    channel_delete: new ChannelDeleteMutationHandler(app),
    chat_create: new ChatCreateMutationHandler(app),
    database_create: new DatabaseCreateMutationHandler(app),
    database_delete: new DatabaseDeleteMutationHandler(app),
    field_create: new FieldCreateMutationHandler(app),
    field_delete: new FieldDeleteMutationHandler(app),
    field_name_update: new FieldNameUpdateMutationHandler(app),
    message_create: new MessageCreateMutationHandler(app),
    file_delete: new FileDeleteMutationHandler(app),
    folder_delete: new FolderDeleteMutationHandler(app),
    node_collaborator_create: new NodeCollaboratorCreateMutationHandler(app),
    node_collaborator_delete: new NodeCollaboratorDeleteMutationHandler(app),
    node_collaborator_update: new NodeCollaboratorUpdateMutationHandler(app),
    node_mark_opened: new NodeMarkOpenedMutationHandler(app),
    node_mark_seen: new NodeMarkSeenMutationHandler(app),
    page_create: new PageCreateMutationHandler(app),
    page_delete: new PageDeleteMutationHandler(app),
    node_reaction_create: new NodeReactionCreateMutationHandler(app),
    node_reaction_delete: new NodeReactionDeleteMutationHandler(app),
    message_delete: new MessageDeleteMutationHandler(app),
    record_create: new RecordCreateMutationHandler(app),
    record_delete: new RecordDeleteMutationHandler(app),
    record_avatar_update: new RecordAvatarUpdateMutationHandler(app),
    record_name_update: new RecordNameUpdateMutationHandler(app),
    record_field_value_delete: new RecordFieldValueDeleteMutationHandler(app),
    record_field_value_set: new RecordFieldValueSetMutationHandler(app),
    select_option_create: new SelectOptionCreateMutationHandler(app),
    select_option_delete: new SelectOptionDeleteMutationHandler(app),
    select_option_update: new SelectOptionUpdateMutationHandler(app),
    server_create: new ServerCreateMutationHandler(app),
    space_create: new SpaceCreateMutationHandler(app),
    space_delete: new SpaceDeleteMutationHandler(app),
    user_role_update: new UserRoleUpdateMutationHandler(app),
    users_invite: new UsersInviteMutationHandler(app),
    workspace_create: new WorkspaceCreateMutationHandler(app),
    workspace_update: new WorkspaceUpdateMutationHandler(app),
    avatar_upload: new AvatarUploadMutationHandler(app),
    account_logout: new AccountLogoutMutationHandler(app),
    folder_create: new FolderCreateMutationHandler(app),
    file_create: new FileCreateMutationHandler(app),
    file_download: new FileDownloadMutationHandler(app),
    file_save_temp: new FileSaveTempMutationHandler(app),
    space_avatar_update: new SpaceAvatarUpdateMutationHandler(app),
    space_description_update: new SpaceDescriptionUpdateMutationHandler(app),
    space_name_update: new SpaceNameUpdateMutationHandler(app),
    account_update: new AccountUpdateMutationHandler(app),
    view_update: new ViewUpdateMutationHandler(app),
    view_delete: new ViewDeleteMutationHandler(app),
    view_name_update: new ViewNameUpdateMutationHandler(app),
    channel_update: new ChannelUpdateMutationHandler(app),
    page_update: new PageUpdateMutationHandler(app),
    folder_update: new FolderUpdateMutationHandler(app),
    database_update: new DatabaseUpdateMutationHandler(app),
    workspace_metadata_save: new WorkspaceMetadataSaveMutationHandler(app),
    workspace_metadata_delete: new WorkspaceMetadataDeleteMutationHandler(app),
    document_update: new DocumentUpdateMutationHandler(app),
    app_metadata_save: new AppMetadataSaveMutationHandler(app),
    app_metadata_delete: new AppMetadataDeleteMutationHandler(app),
    account_metadata_save: new AccountMetadataSaveMutationHandler(app),
    account_metadata_delete: new AccountMetadataDeleteMutationHandler(app),
    email_password_reset_init: new EmailPasswordResetInitMutationHandler(app),
    email_password_reset_complete:
      new EmailPasswordResetCompleteMutationHandler(app),
    workspace_delete: new WorkspaceDeleteMutationHandler(app),
  };
};
