import { FileDialogOpenCommandHandler } from '@/main/commands/file-dialog-open';
import { FileOpenCommandHandler } from '@/main/commands/file-open';
import { UrlOpenCommandHandler } from '@/main/commands/url-open';
import { CommandHandler } from '@/main/types';
import { CommandMap } from '@/shared/commands';

type CommandHandlerMap = {
  [K in keyof CommandMap]: CommandHandler<CommandMap[K]['input']>;
};

export const commandHandlerMap: CommandHandlerMap = {
  file_dialog_open: new FileDialogOpenCommandHandler(),
  file_open: new FileOpenCommandHandler(),
  url_open: new UrlOpenCommandHandler(),
};
