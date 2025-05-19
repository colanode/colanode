import { CommandMap } from '@colanode/client/commands';
import { FileDialogOpenCommandHandler } from '@colanode/client/handlers/commands/file-dialog-open';
import { FileOpenCommandHandler } from '@colanode/client/handlers/commands/file-open';
import { UrlOpenCommandHandler } from '@colanode/client/handlers/commands/url-open';
import { CommandHandler } from '@colanode/client/lib/types';
import { AppService } from '@colanode/client/services/app-service';

export type CommandHandlerMap = {
  [K in keyof CommandMap]: CommandHandler<CommandMap[K]['input']>;
};

export const buildCommandHandlerMap = (_: AppService): CommandHandlerMap => ({
  file_dialog_open: new FileDialogOpenCommandHandler(),
  file_open: new FileOpenCommandHandler(),
  url_open: new UrlOpenCommandHandler(),
});
