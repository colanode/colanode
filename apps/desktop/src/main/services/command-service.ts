import { createDebugger } from '@/main/debugger';
import { commandHandlerMap } from '@/main/commands';
import { CommandHandler } from '@/main/types';
import { CommandInput, CommandMap } from '@/shared/commands';

class CommandService {
  private readonly debug = createDebugger('service:command');

  public async executeCommand<T extends CommandInput>(
    input: T
  ): Promise<CommandMap[T['type']]['output']> {
    this.debug(`Executing command: ${input.type}`);

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
