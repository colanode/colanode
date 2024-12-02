import { createLogger } from '@/main/logger';
import { mutationHandlerMap } from '@/main/mutations';
import { MutationHandler } from '@/main/types';
import {
  MutationError,
  MutationInput,
  MutationResult,
} from '@/shared/mutations';

class MutationService {
  private readonly logger = createLogger('mutation-service');

  public async executeMutation<T extends MutationInput>(
    input: T
  ): Promise<MutationResult<T>> {
    const handler = mutationHandlerMap[
      input.type
    ] as unknown as MutationHandler<T>;

    this.logger.trace(`Executing mutation: ${input.type}`);

    try {
      if (!handler) {
        throw new Error(`No handler found for mutation type: ${input.type}`);
      }

      const output = await handler.handleMutation(input);
      return { success: true, output };
    } catch (error) {
      if (error instanceof MutationError) {
        return {
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        };
      }

      return {
        success: false,
        error: {
          code: 'unknown',
          message: 'Something went wrong trying to execute the mutation.',
        },
      };
    }
  }
}

export const mutationService = new MutationService();
