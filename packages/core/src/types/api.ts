import { z } from 'zod';

export enum ApiHeader {
  ClientType = 'colanode-client-type',
  ClientPlatform = 'colanode-client-platform',
  ClientVersion = 'colanode-client-version',
}

export enum ApiErrorCode {
  AccountNotFound = 'account_not_found',
  DeviceNotFound = 'device_not_found',
  AccountMismatch = 'account_mismatch',
  AccountOtpInvalid = 'account_otp_invalid',
  AccountOtpTooManyAttempts = 'account_otp_too_many_attempts',
  AccountPendingVerification = 'account_pending_verification',
  EmailOrPasswordIncorrect = 'email_or_password_incorrect',
  GoogleAuthFailed = 'google_auth_failed',
  AccountCreationFailed = 'account_creation_failed',
  EmailAlreadyExists = 'email_already_exists',
  AvatarNotFound = 'avatar_not_found',
  AvatarDownloadFailed = 'avatar_download_failed',
  AvatarFileNotUploaded = 'avatar_file_not_uploaded',
  AvatarUploadFailed = 'avatar_upload_failed',
  WorkspaceNameRequired = 'workspace_name_required',
  WorkspaceDeleteNotAllowed = 'workspace_delete_not_allowed',
  WorkspaceNotFound = 'workspace_not_found',
  WorkspaceNoAccess = 'workspace_no_access',
  WorkspaceUpdateNotAllowed = 'workspace_update_not_allowed',
  WorkspaceUpdateFailed = 'workspace_update_failed',
  FileNotFound = 'file_not_found',
  FileNoAccess = 'file_no_access',
  FileNotReady = 'file_not_ready',
  FileOwnerMismatch = 'file_owner_mismatch',
  FileAlreadyUploaded = 'file_already_uploaded',
  FileUploadInitFailed = 'file_upload_init_failed',
  WorkspaceMismatch = 'workspace_mismatch',
  FileError = 'file_error',
  FileSizeMismatch = 'file_size_mismatch',
  FileMimeTypeMismatch = 'file_mime_type_mismatch',
  FileUploadCompleteFailed = 'file_upload_complete_failed',
  FileUploadNotFound = 'file_upload_not_found',
  UserEmailRequired = 'user_email_required',
  UserInviteNoAccess = 'user_invite_no_access',
  UserUpdateNoAccess = 'user_update_no_access',
  UserNotFound = 'user_not_found',
  TokenMissing = 'token_missing',
  TokenInvalid = 'token_invalid',
  RootNotFound = 'root_not_found',

  ValidationError = 'validation_error',
  TooManyRequests = 'too_many_requests',
  Unauthorized = 'unauthorized',
  Forbidden = 'forbidden',
  NotFound = 'not_found',
  BadRequest = 'bad_request',
  Unknown = 'unknown',
}

export const apiErrorOutputSchema = z.object({
  message: z.string(),
  code: z.nativeEnum(ApiErrorCode),
});

export type ApiErrorOutput = z.infer<typeof apiErrorOutputSchema>;
