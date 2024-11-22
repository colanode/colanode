import { CommandInput } from '@/shared/commands';
import { logService } from '@/main/services/log-service';
import { CommandMap } from '@/shared/commands';
import { commandHandlerMap } from '@/main/commands';
import { CommandHandler } from '@/main/types';

class CommandService {
  private readonly logger = logService.createLogger('command-service');

  public async executeCommand<T extends CommandInput>(
    input: T
  ): Promise<CommandMap[T['type']]['output']> {
    this.logger.debug(`Executing command: ${input.type}`);

    const handler = commandHandlerMap[
      input.type
    ] as unknown as CommandHandler<T>;

    if (!handler) {
      this.logger.warn(`No handler found for command type: ${input.type}`);
      throw new Error(`No handler found for command type: ${input.type}`);
    }

    return handler.handleCommand(input);
  }
}

export const commandService = new CommandService();
