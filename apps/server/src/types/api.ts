export enum ApiError {
  GoogleAuthFailed = 'GoogleAuthFailed',
  UserPendingActivation = 'UserPendingActivation',
  InternalServerError = 'InternalServerError',
  EmailAlreadyExists = 'EmailAlreadyExists',
  EmailOrPasswordIncorrect = 'EmailOrPasswordIncorrect',
  MissingRequiredFields = 'MissingRequiredFields',
  ResourceNotFound = 'ResourceNotFound',
  Unauthorized = 'Unauthorized',
  Forbidden = 'Forbidden',
  BadRequest = 'BadRequest',
}

export type ColanodeRequestAccount = {
  id: string;
  deviceId: string;
};
