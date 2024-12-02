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

export type MutationErrorCode =
  | 'unknown'
  | 'account_not_found'
  | 'account_login_failed'
  | 'account_register_failed'
  | 'server_not_found'
  | 'invalid_attributes'
  | 'space_not_found'
  | 'channel_not_found'
  | 'unauthorized'
  | 'invalid_file'
  | 'node_not_found'
  | 'view_not_found'
  | 'field_not_found'
  | 'invalid_field_type'
  | 'select_option_not_found'
  | 'message_not_found'
  | 'invalid_server_domain'
  | 'server_already_exists'
  | 'workspace_not_found';
