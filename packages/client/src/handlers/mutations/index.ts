import { MutationHandler } from '@colanode/client/lib';
import { MutationMap } from '@colanode/client/mutations';
import { AppService } from '@colanode/client/services';

import { AccountLogoutMutationHandler } from './accounts/account-logout';
import { AccountUpdateMutationHandler } from './accounts/account-update';
import { MetadataDeleteMutationHandler } from './apps/metadata-delete';
import { MetadataUpdateMutationHandler } from './apps/metadata-update';
import { TabCreateMutationHandler } from './apps/tab-create';
import { TabDeleteMutationHandler } from './apps/tab-delete';
import { TabUpdateMutationHandler } from './apps/tab-update';
import { EmailLoginMutationHandler } from './auth/email-login';
import { EmailPasswordResetCompleteMutationHandler } from './auth/email-password-reset-complete';
import { EmailPasswordResetInitMutationHandler } from './auth/email-password-reset-init';
import { EmailRegisterMutationHandler } from './auth/email-register';
import { EmailVerifyMutationHandler } from './auth/email-verify';
import { GoogleLoginMutationHandler } from './auth/google-login';
import { AvatarUploadMutationHandler } from './avatars/avatar-upload';
import { ChatCreateMutationHandler } from './chats/chat-create';
import { DocumentUpdateMutationHandler } from './documents/document-update';
import { FileCreateMutationHandler } from './files/file-create';
import { FileDownloadMutationHandler } from './files/file-download';
import { TempFileCreateMutationHandler } from './files/temp-file-create';
import { MessageCreateMutationHandler } from './messages/message-create';
import { NodeCollaboratorCreateMutationHandler } from './nodes/node-collaborator-create';
import { NodeCollaboratorDeleteMutationHandler } from './nodes/node-collaborator-delete';
import { NodeCollaboratorUpdateMutationHandler } from './nodes/node-collaborator-update';
import { NodeCreateMutationHandler } from './nodes/node-create';
import { NodeDeleteMutationHandler } from './nodes/node-delete';
import { NodeInteractionOpenedMutationHandler } from './nodes/node-interaction-opened';
import { NodeInteractionSeenMutationHandler } from './nodes/node-interaction-seen';
import { NodeReactionCreateMutationHandler } from './nodes/node-reaction-create';
import { NodeReactionDeleteMutationHandler } from './nodes/node-reaction-delete';
import { NodeUpdateMutationHandler } from './nodes/node-update';
import { ServerCreateMutationHandler } from './servers/server-create';
import { ServerDeleteMutationHandler } from './servers/server-delete';
import { ServerSyncMutationHandler } from './servers/server-sync';
import { SpaceChildReorderMutationHandler } from './spaces/space-child-reorder';
import { UserRoleUpdateMutationHandler } from './users/user-role-update';
import { UserStorageUpdateMutationHandler } from './users/user-storage-update';
import { UsersCreateMutationHandler } from './users/users-create';
import { WorkspaceCreateMutationHandler } from './workspaces/workspace-create';
import { WorkspaceDeleteMutationHandler } from './workspaces/workspace-delete';
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
    'google.login': new GoogleLoginMutationHandler(app),
    'node.delete': new NodeDeleteMutationHandler(app),
    'node.create': new NodeCreateMutationHandler(app),
    'node.update': new NodeUpdateMutationHandler(app),
    'chat.create': new ChatCreateMutationHandler(app),
    'message.create': new MessageCreateMutationHandler(app),
    'node.collaborator.create': new NodeCollaboratorCreateMutationHandler(app),
    'node.collaborator.delete': new NodeCollaboratorDeleteMutationHandler(app),
    'node.collaborator.update': new NodeCollaboratorUpdateMutationHandler(app),
    'node.interaction.opened': new NodeInteractionOpenedMutationHandler(app),
    'node.interaction.seen': new NodeInteractionSeenMutationHandler(app),
    'node.reaction.create': new NodeReactionCreateMutationHandler(app),
    'node.reaction.delete': new NodeReactionDeleteMutationHandler(app),
    'server.create': new ServerCreateMutationHandler(app),
    'server.delete': new ServerDeleteMutationHandler(app),
    'server.sync': new ServerSyncMutationHandler(app),
    'user.role.update': new UserRoleUpdateMutationHandler(app),
    'users.create': new UsersCreateMutationHandler(app),
    'workspace.create': new WorkspaceCreateMutationHandler(app),
    'workspace.update': new WorkspaceUpdateMutationHandler(app),
    'avatar.upload': new AvatarUploadMutationHandler(app),
    'account.logout': new AccountLogoutMutationHandler(app),
    'file.create': new FileCreateMutationHandler(app),
    'file.download': new FileDownloadMutationHandler(app),
    'space.child.reorder': new SpaceChildReorderMutationHandler(app),
    'account.update': new AccountUpdateMutationHandler(app),
    'document.update': new DocumentUpdateMutationHandler(app),
    'metadata.update': new MetadataUpdateMutationHandler(app),
    'metadata.delete': new MetadataDeleteMutationHandler(app),
    'email.password.reset.init': new EmailPasswordResetInitMutationHandler(app),
    'email.password.reset.complete':
      new EmailPasswordResetCompleteMutationHandler(app),
    'workspace.delete': new WorkspaceDeleteMutationHandler(app),
    'user.storage.update': new UserStorageUpdateMutationHandler(app),
    'temp.file.create': new TempFileCreateMutationHandler(app),
    'tab.create': new TabCreateMutationHandler(app),
    'tab.update': new TabUpdateMutationHandler(app),
    'tab.delete': new TabDeleteMutationHandler(app),
  };
};
