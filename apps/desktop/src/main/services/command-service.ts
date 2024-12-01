import { commandHandlerMap } from '@/main/commands';
import { createLogger } from '@/main/logger';
import { CommandHandler } from '@/main/types';
import { CommandInput, CommandMap } from '@/shared/commands';

class CommandService {
  private readonly logger = createLogger('command-service');

  public async executeCommand<T extends CommandInput>(
    input: T
  ): Promise<CommandMap[T['type']]['output']> {
    this.logger.trace(`Executing command: ${input.type}`);

    const handler = commandHandlerMap[
      input.type
    ] as unknown as CommandHandler<T>;

    if (!handler) {
      throw new Error(`No handler found for command type: ${input.type}`);
    }

    return handler.handleCommand(input);
  }
}

export const commandService = new CommandService();
