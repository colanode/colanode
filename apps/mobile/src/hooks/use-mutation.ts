import { useCallback, useState } from 'react';

import {
  MutationError,
  MutationErrorCode,
  MutationErrorData,
  MutationInput,
  MutationMap,
} from '@colanode/client/mutations';

import { useAppService } from '@colanode/mobile/contexts/app-service';

interface MutationOptions<T extends MutationInput> {
  input: T;
  onSuccess?: (output: MutationMap[T['type']]['output']) => void;
  onError?: (error: MutationErrorData) => void;
}

export const useMutation = () => {
  const { appService } = useAppService();
  const [isPending, setIsPending] = useState(false);

  const mutate = useCallback(
    async <T extends MutationInput>(options: MutationOptions<T>) => {
      setIsPending(true);
      try {
        const result = await appService.mediator.executeMutation(options.input);
        if (result.success) {
          options.onSuccess?.(result.output);
          return;
        }

        throw new MutationError(result.error.code, result.error.message);
      } catch (error) {
        if (error instanceof MutationError) {
          options.onError?.(error);
        } else {
          options.onError?.({
            code: MutationErrorCode.Unknown,
            message: 'Something went wrong trying to execute the mutation.',
          });
        }
      } finally {
        setIsPending(false);
      }
    },
    [appService]
  );

  return {
    isPending,
    mutate,
  };
};
