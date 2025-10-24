import { MutationHandler } from '@colanode/client/lib';
import { MutationMap } from '@colanode/client/mutations';
import { AppService } from '@colanode/client/services';

import { AccountLogoutMutationHandler } from './accounts/account-logout';
import { AccountUpdateMutationHandler } from './accounts/account-update';
import { EmailLoginMutationHandler } from './accounts/email-login';
import { EmailPasswordResetCompleteMutationHandler } from './accounts/email-password-reset-complete';
import { EmailPasswordResetInitMutationHandler } from './accounts/email-password-reset-init';
import { EmailRegisterMutationHandler } from './accounts/email-register';
import { EmailVerifyMutationHandler } from './accounts/email-verify';
import { GoogleLoginMutationHandler } from './accounts/google-login';
import { MetadataDeleteMutationHandler } from './apps/metadata-delete';
import { MetadataUpdateMutationHandler } from './apps/metadata-update';
import { TabCreateMutationHandler } from './apps/tab-create';
import { TabDeleteMutationHandler } from './apps/tab-delete';
import { TabUpdateMutationHandler } from './apps/tab-update';
import { AvatarUploadMutationHandler } from './avatars/avatar-upload';
import { DocumentUpdateMutationHandler } from './documents/document-update';
import { FileCreateMutationHandler } from './files/file-create';
import { FileDeleteMutationHandler } from './files/file-delete';
import { FileDownloadMutationHandler } from './files/file-download';
import { TempFileCreateMutationHandler } from './files/temp-file-create';
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
    'node.create': new NodeCreateMutationHandler(app),
    'email.login': new EmailLoginMutationHandler(app),
    'email.register': new EmailRegisterMutationHandler(app),
    'email.verify': new EmailVerifyMutationHandler(app),
    'google.login': new GoogleLoginMutationHandler(app),
    'file.delete': new FileDeleteMutationHandler(app),
    'node.collaborator.create': new NodeCollaboratorCreateMutationHandler(app),
    'node.collaborator.delete': new NodeCollaboratorDeleteMutationHandler(app),
    'node.collaborator.update': new NodeCollaboratorUpdateMutationHandler(app),
    'node.interaction.opened': new NodeInteractionOpenedMutationHandler(app),
    'node.interaction.seen': new NodeInteractionSeenMutationHandler(app),
    'node.reaction.create': new NodeReactionCreateMutationHandler(app),
    'node.reaction.delete': new NodeReactionDeleteMutationHandler(app),
    'server.create': new ServerCreateMutationHandler(app),
    'server.delete': new ServerDeleteMutationHandler(app),
    'user.role.update': new UserRoleUpdateMutationHandler(app),
    'users.create': new UsersCreateMutationHandler(app),
    'workspace.create': new WorkspaceCreateMutationHandler(app),
    'workspace.update': new WorkspaceUpdateMutationHandler(app),
    'avatar.upload': new AvatarUploadMutationHandler(app),
    'account.logout': new AccountLogoutMutationHandler(app),
    'file.create': new FileCreateMutationHandler(app),
    'file.download': new FileDownloadMutationHandler(app),
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
    'node.delete': new NodeDeleteMutationHandler(app),
    'node.update': new NodeUpdateMutationHandler(app),
  };
};
