import { MutationHandler } from '@colanode/client/lib';
import { MutationMap } from '@colanode/client/mutations';
import { AppService } from '@colanode/client/services';

import { AccountLogoutMutationHandler } from './accounts/account-logout';
import { AccountMetadataDeleteMutationHandler } from './accounts/account-metadata-delete';
import { AccountMetadataUpsertMutationHandler } from './accounts/account-metadata-upsert';
import { AccountUpdateMutationHandler } from './accounts/account-update';
import { EmailLoginMutationHandler } from './accounts/email-login';
import { EmailPasswordResetCompleteMutationHandler } from './accounts/email-password-reset-complete';
import { EmailPasswordResetInitMutationHandler } from './accounts/email-password-reset-init';
import { EmailRegisterMutationHandler } from './accounts/email-register';
import { EmailVerifyMutationHandler } from './accounts/email-verify';
import { AppMetadataDeleteMutationHandler } from './apps/app-metadata-delete';
import { AppMetadataUpsertMutationHandler } from './apps/app-metadata-upsert';
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
import { UsersCreateMutationHandler } from './users/users-create';
import { WorkspaceCreateMutationHandler } from './workspaces/workspace-create';
import { WorkspaceDeleteMutationHandler } from './workspaces/workspace-delete';
import { WorkspaceMetadataDeleteMutationHandler } from './workspaces/workspace-metadata-delete';
import { WorkspaceMetadataUpsertMutationHandler } from './workspaces/workspace-metadata-upsert';
import { WorkspaceUpdateMutationHandler } from './workspaces/workspace-update';

export type MutationHandlerMap = {
  [K in keyof MutationMap]: MutationHandler<MutationMap[K]['input']>;
};

export const buildMutationHandlerMap = (
  app: AppService
): MutationHandlerMap => {
  return {
    'email.login': new EmailLoginMutationHandler(app),
    'email.register': new EmailRegisterMutationHandler(app),
    'email.verify': new EmailVerifyMutationHandler(app),
    'view.create': new ViewCreateMutationHandler(app),
    'channel.create': new ChannelCreateMutationHandler(app),
    'channel.delete': new ChannelDeleteMutationHandler(app),
    'chat.create': new ChatCreateMutationHandler(app),
    'database.create': new DatabaseCreateMutationHandler(app),
    'database.delete': new DatabaseDeleteMutationHandler(app),
    'field.create': new FieldCreateMutationHandler(app),
    'field.delete': new FieldDeleteMutationHandler(app),
    'field.name.update': new FieldNameUpdateMutationHandler(app),
    'message.create': new MessageCreateMutationHandler(app),
    'file.delete': new FileDeleteMutationHandler(app),
    'folder.delete': new FolderDeleteMutationHandler(app),
    'node.collaborator.create': new NodeCollaboratorCreateMutationHandler(app),
    'node.collaborator.delete': new NodeCollaboratorDeleteMutationHandler(app),
    'node.collaborator.update': new NodeCollaboratorUpdateMutationHandler(app),
    'node.mark.opened': new NodeMarkOpenedMutationHandler(app),
    'node.mark.seen': new NodeMarkSeenMutationHandler(app),
    'page.create': new PageCreateMutationHandler(app),
    'page.delete': new PageDeleteMutationHandler(app),
    'node.reaction.create': new NodeReactionCreateMutationHandler(app),
    'node.reaction.delete': new NodeReactionDeleteMutationHandler(app),
    'message.delete': new MessageDeleteMutationHandler(app),
    'record.create': new RecordCreateMutationHandler(app),
    'record.delete': new RecordDeleteMutationHandler(app),
    'record.avatar.update': new RecordAvatarUpdateMutationHandler(app),
    'record.name.update': new RecordNameUpdateMutationHandler(app),
    'record.field.value.delete': new RecordFieldValueDeleteMutationHandler(app),
    'record.field.value.set': new RecordFieldValueSetMutationHandler(app),
    'select.option.create': new SelectOptionCreateMutationHandler(app),
    'select.option.delete': new SelectOptionDeleteMutationHandler(app),
    'select.option.update': new SelectOptionUpdateMutationHandler(app),
    'server.create': new ServerCreateMutationHandler(app),
    'space.create': new SpaceCreateMutationHandler(app),
    'space.delete': new SpaceDeleteMutationHandler(app),
    'user.role.update': new UserRoleUpdateMutationHandler(app),
    'users.create': new UsersCreateMutationHandler(app),
    'workspace.create': new WorkspaceCreateMutationHandler(app),
    'workspace.update': new WorkspaceUpdateMutationHandler(app),
    'avatar.upload': new AvatarUploadMutationHandler(app),
    'account.logout': new AccountLogoutMutationHandler(app),
    'folder.create': new FolderCreateMutationHandler(app),
    'file.create': new FileCreateMutationHandler(app),
    'file.download': new FileDownloadMutationHandler(app),
    'file.save.temp': new FileSaveTempMutationHandler(app),
    'space.avatar.update': new SpaceAvatarUpdateMutationHandler(app),
    'space.description.update': new SpaceDescriptionUpdateMutationHandler(app),
    'space.name.update': new SpaceNameUpdateMutationHandler(app),
    'account.update': new AccountUpdateMutationHandler(app),
    'view.update': new ViewUpdateMutationHandler(app),
    'view.delete': new ViewDeleteMutationHandler(app),
    'view.name.update': new ViewNameUpdateMutationHandler(app),
    'channel.update': new ChannelUpdateMutationHandler(app),
    'page.update': new PageUpdateMutationHandler(app),
    'folder.update': new FolderUpdateMutationHandler(app),
    'database.update': new DatabaseUpdateMutationHandler(app),
    'workspace.metadata.upsert': new WorkspaceMetadataUpsertMutationHandler(
      app
    ),
    'workspace.metadata.delete': new WorkspaceMetadataDeleteMutationHandler(
      app
    ),
    'document.update': new DocumentUpdateMutationHandler(app),
    'app.metadata.upsert': new AppMetadataUpsertMutationHandler(app),
    'app.metadata.delete': new AppMetadataDeleteMutationHandler(app),
    'account.metadata.upsert': new AccountMetadataUpsertMutationHandler(app),
    'account.metadata.delete': new AccountMetadataDeleteMutationHandler(app),
    'email.password.reset.init': new EmailPasswordResetInitMutationHandler(app),
    'email.password.reset.complete':
      new EmailPasswordResetCompleteMutationHandler(app),
    'workspace.delete': new WorkspaceDeleteMutationHandler(app),
  };
};
