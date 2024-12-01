import { NextFunction,Request, Response } from 'express';

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

export type ColanodeRequest = Request & {
  account?: ColanodeRequestAccount;
};

export type ColanodeResponse = Response;

export type ColanodeNextFunction = NextFunction;
