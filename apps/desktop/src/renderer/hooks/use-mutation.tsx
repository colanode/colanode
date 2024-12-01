import React from 'react';

import { MutationInput, MutationMap } from '@/shared/mutations';

interface MutationOptions<T extends MutationInput> {
  input: T;
  onSuccess?: (output: MutationMap[T['type']]['output']) => void;
  onError?: (error: Error) => void;
}

export const useMutation = () => {
  const [isPending, setIsPending] = React.useState(false);

  const mutate = React.useCallback(
    async <T extends MutationInput>(options: MutationOptions<T>) => {
      setIsPending(true);
      try {
        const output = await window.colanode.executeMutation(options.input);
        options.onSuccess?.(output);
        return output;
      } catch (error) {
        options.onError?.(error as Error);
        throw error;
      } finally {
        setIsPending(false);
      }
    },
    []
  );

  return {
    isPending,
    mutate: mutate,
  };
};
