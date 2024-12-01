import { MutationInput, MutationMap } from '@/shared/mutations';
import { mutationHandlerMap } from '@/main/mutations';
import { MutationHandler } from '@/main/types';
import { createLogger } from '@/main/logger';

class MutationService {
  private readonly logger = createLogger('mutation-service');

  public async executeMutation<T extends MutationInput>(
    input: T
  ): Promise<MutationMap[T['type']]['output']> {
    const handler = mutationHandlerMap[
      input.type
    ] as unknown as MutationHandler<T>;

    this.logger.trace(`Executing mutation: ${input.type}`);

    if (!handler) {
      throw new Error(`No handler found for mutation type: ${input.type}`);
    }

    return handler.handleMutation(input);
  }
}

export const mutationService = new MutationService();
