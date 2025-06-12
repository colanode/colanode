export * from './accounts/account-logout';
export * from './accounts/account-metadata-delete';
export * from './accounts/account-metadata-update';
export * from './accounts/account-update';
export * from './accounts/email-login';
export * from './accounts/email-password-reset-complete';
export * from './accounts/email-password-reset-init';
export * from './accounts/email-register';
export * from './accounts/email-verify';
export * from './accounts/google-login';
export * from './apps/app-metadata-delete';
export * from './apps/app-metadata-update';
export * from './avatars/avatar-upload';
export * from './channels/channel-create';
export * from './channels/channel-delete';
export * from './channels/channel-update';
export * from './chats/chat-create';
export * from './databases/database-create';
export * from './databases/database-delete';
export * from './databases/database-update';
export * from './databases/field-create';
export * from './databases/field-delete';
export * from './databases/field-name-update';
export * from './databases/select-option-create';
export * from './databases/select-option-delete';
export * from './databases/select-option-update';
export * from './databases/view-create';
export * from './databases/view-delete';
export * from './databases/view-name-update';
export * from './databases/view-update';
export * from './documents/document-update';
export * from './files/file-create';
export * from './files/file-delete';
export * from './files/file-download';
export * from './files/file-save-temp';
export * from './folders/folder-create';
export * from './folders/folder-delete';
export * from './folders/folder-update';
export * from './messages/message-create';
export * from './messages/message-delete';
export * from './nodes/node-collaborator-create';
export * from './nodes/node-collaborator-delete';
export * from './nodes/node-collaborator-update';
export * from './nodes/node-interaction-opened';
export * from './nodes/node-interaction-seen';
export * from './nodes/node-reaction-create';
export * from './nodes/node-reaction-delete';
export * from './pages/page-create';
export * from './pages/page-delete';
export * from './pages/page-update';
export * from './records/record-avatar-update';
export * from './records/record-create';
export * from './records/record-delete';
export * from './records/record-field-value-delete';
export * from './records/record-field-value-set';
export * from './records/record-name-update';
export * from './servers/server-create';
export * from './servers/server-delete';
export * from './spaces/space-avatar-update';
export * from './spaces/space-create';
export * from './spaces/space-delete';
export * from './spaces/space-description-update';
export * from './spaces/space-name-update';
export * from './workspaces/workspace-create';
export * from './workspaces/workspace-delete';
export * from './workspaces/workspace-metadata-delete';
export * from './workspaces/workspace-metadata-update';
export * from './workspaces/workspace-update';
export * from './users/user-role-update';
export * from './users/users-create';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface MutationMap {}

export type MutationInput = MutationMap[keyof MutationMap]['input'];

export type MutationErrorData = {
  code: MutationErrorCode;
  message: string;
};

export type SuccessMutationResult<T extends MutationInput> = {
  success: true;
  output: MutationMap[T['type']]['output'];
};

export type ErrorMutationResult = {
  success: false;
  error: MutationErrorData;
};

export type MutationResult<T extends MutationInput> =
  | SuccessMutationResult<T>
  | ErrorMutationResult;

export class MutationError extends Error {
  constructor(
    public code: MutationErrorCode,
    message: string
  ) {
    super(message);
  }
}

export enum MutationErrorCode {
  Unknown = 'unknown',
  ApiError = 'api_error',
  AccountNotFound = 'account_not_found',
  AccountLoginFailed = 'account_login_failed',
  AccountRegisterFailed = 'account_register_failed',
  EmailVerificationFailed = 'email_verification_failed',
  ServerNotFound = 'server_not_found',
  WorkspaceNotFound = 'workspace_not_found',
  WorkspaceNotCreated = 'workspace_not_created',
  WorkspaceNotUpdated = 'workspace_not_updated',
  SpaceNotFound = 'space_not_found',
  SpaceUpdateForbidden = 'space_update_forbidden',
  SpaceUpdateFailed = 'space_update_failed',
  SpaceCreateForbidden = 'space_create_forbidden',
  SpaceCreateFailed = 'space_create_failed',
  ServerDeleteForbidden = 'server_delete_forbidden',
  ServerUrlInvalid = 'server_url_invalid',
  ServerInitFailed = 'server_init_failed',
  ChannelNotFound = 'channel_not_found',
  ChannelUpdateForbidden = 'channel_update_forbidden',
  ChannelUpdateFailed = 'channel_update_failed',
  DatabaseNotFound = 'database_not_found',
  DatabaseUpdateForbidden = 'database_update_forbidden',
  DatabaseUpdateFailed = 'database_update_failed',
  RelationDatabaseNotFound = 'relation_database_not_found',
  FieldNotFound = 'field_not_found',
  FileInvalid = 'file_invalid',
  FieldCreateForbidden = 'field_create_forbidden',
  FieldCreateFailed = 'field_create_failed',
  FieldUpdateForbidden = 'field_update_forbidden',
  FieldUpdateFailed = 'field_update_failed',
  FieldDeleteForbidden = 'field_delete_forbidden',
  FieldDeleteFailed = 'field_delete_failed',
  FieldTypeInvalid = 'field_type_invalid',
  SelectOptionCreateForbidden = 'select_option_create_forbidden',
  SelectOptionCreateFailed = 'select_option_create_failed',
  SelectOptionNotFound = 'select_option_not_found',
  SelectOptionUpdateForbidden = 'select_option_update_forbidden',
  SelectOptionUpdateFailed = 'select_option_update_failed',
  SelectOptionDeleteForbidden = 'select_option_delete_forbidden',
  SelectOptionDeleteFailed = 'select_option_delete_failed',
  ViewNotFound = 'view_not_found',
  ViewCreateForbidden = 'view_create_forbidden',
  ViewCreateFailed = 'view_create_failed',
  ViewUpdateForbidden = 'view_update_forbidden',
  ViewUpdateFailed = 'view_update_failed',
  ViewDeleteForbidden = 'view_delete_forbidden',
  ViewDeleteFailed = 'view_delete_failed',
  RecordUpdateForbidden = 'record_update_forbidden',
  RecordUpdateFailed = 'record_update_failed',
  PageUpdateForbidden = 'page_update_forbidden',
  PageUpdateFailed = 'page_update_failed',
  NodeCollaboratorCreateForbidden = 'node_collaborator_create_forbidden',
  NodeCollaboratorCreateFailed = 'node_collaborator_create_failed',
  NodeCollaboratorDeleteForbidden = 'node_collaborator_delete_forbidden',
  NodeCollaboratorDeleteFailed = 'node_collaborator_delete_failed',
  NodeCollaboratorUpdateForbidden = 'node_collaborator_update_forbidden',
  NodeCollaboratorUpdateFailed = 'node_collaborator_update_failed',
  UserNotFound = 'user_not_found',
  NodeNotFound = 'node_not_found',
  RootNotFound = 'root_not_found',
  FileCreateForbidden = 'file_create_forbidden',
  FileCreateFailed = 'file_create_failed',
  FileNotFound = 'file_not_found',
  FileNotReady = 'file_not_ready',
  FileDeleteForbidden = 'file_delete_forbidden',
  FileDeleteFailed = 'file_delete_failed',
  FolderUpdateForbidden = 'folder_update_forbidden',
  StorageLimitExceeded = 'storage_limit_exceeded',
  FileTooLarge = 'file_too_large',
  FolderUpdateFailed = 'folder_update_failed',
  MessageCreateForbidden = 'message_create_forbidden',
  MessageCreateFailed = 'message_create_failed',
  MessageDeleteForbidden = 'message_delete_forbidden',
  MessageDeleteFailed = 'message_delete_failed',
  MessageNotFound = 'message_not_found',
  NodeReactionCreateForbidden = 'node_reaction_create_forbidden',
}
