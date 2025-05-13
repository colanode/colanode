import { FileDialogOpenCommandHandler } from './file-dialog-open';
import { FileOpenCommandHandler } from './file-open';
import { UrlOpenCommandHandler } from './url-open';

import { CommandHandler } from '../../lib/types';
import { CommandMap } from '../../commands';
import { AppService } from '../../services/app-service';

export type CommandHandlerMap = {
  [K in keyof CommandMap]: CommandHandler<CommandMap[K]['input']>;
};

export const buildCommandHandlerMap = (_: AppService): CommandHandlerMap => ({
  file_dialog_open: new FileDialogOpenCommandHandler(),
  file_open: new FileOpenCommandHandler(),
  url_open: new UrlOpenCommandHandler(),
});
