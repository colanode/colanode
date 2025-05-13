import { isAxiosError } from 'axios';
import { ApiErrorCode, ApiErrorOutput } from '@colanode/core';

export const parseApiError = (error: unknown): ApiErrorOutput => {
  if (isAxiosError(error) && error.response) {
    if (
      error.response.data &&
      error.response.data.code &&
      error.response.data.message
    ) {
      return error.response.data as ApiErrorOutput;
    }

    if (error.response.status === 401) {
      return {
        code: ApiErrorCode.Unauthorized,
        message: 'You are not authorized to perform this action',
      };
    }

    if (error.response.status === 403) {
      return {
        code: ApiErrorCode.Forbidden,
        message: 'You are forbidden from performing this action',
      };
    }

    if (error.response.status === 404) {
      return {
        code: ApiErrorCode.NotFound,
        message: 'Resource not found',
      };
    }

    if (error.response.status === 400) {
      return {
        code: ApiErrorCode.BadRequest,
        message: 'Bad request',
      };
    }
  }

  return {
    code: ApiErrorCode.Unknown,
    message: 'An unknown error occurred',
  };
};
