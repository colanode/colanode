import { CommandInput, CommandMap } from '@/shared/commands';
import { createLogger } from '@/main/logger';
import { commandHandlerMap } from '@/main/commands';
import { CommandHandler } from '@/main/types';

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
