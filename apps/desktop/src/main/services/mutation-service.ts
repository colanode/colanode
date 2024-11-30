import { MutationInput } from '@/shared/mutations';

import { MutationMap } from '@/shared/mutations';
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

    this.logger.debug(`Executing mutation: ${input.type}`);

    if (!handler) {
      this.logger.warn(`No handler found for mutation type: ${input.type}`);
      throw new Error(`No handler found for mutation type: ${input.type}`);
    }

    return handler.handleMutation(input);
  }
}

export const mutationService = new MutationService();
