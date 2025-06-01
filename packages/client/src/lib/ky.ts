import { HTTPError } from 'ky';

import { ApiErrorCode, ApiErrorOutput } from '@colanode/core';

export const parseApiError = async (
  error: unknown
): Promise<ApiErrorOutput> => {
  if (error instanceof HTTPError) {
    try {
      const errorData = await error.response.json();
      if (errorData && errorData.code && errorData.message) {
        return errorData as ApiErrorOutput;
      }
    } catch {
      switch (error.response.status) {
        case 401:
          return {
            code: ApiErrorCode.Unauthorized,
            message: 'You are not authorized to perform this action',
          };
        case 403:
          return {
            code: ApiErrorCode.Forbidden,
            message: 'You are forbidden from performing this action',
          };
        case 404:
          return {
            code: ApiErrorCode.NotFound,
            message: 'Resource not found',
          };
        case 400:
          return {
            code: ApiErrorCode.BadRequest,
            message: 'Bad request',
          };
      }
    }
  }

  return {
    code: ApiErrorCode.Unknown,
    message: 'An unknown error occurred',
  };
};
