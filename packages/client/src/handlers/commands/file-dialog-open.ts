// import { BrowserWindow, dialog } from 'electron';

import { FileDialogOpenCommandInput } from '@colanode/client/commands/file-dialog-open';
import { CommandHandler } from '@colanode/client/lib/types';

export class FileDialogOpenCommandHandler
  implements CommandHandler<FileDialogOpenCommandInput>
{
  public async handleCommand(_input: FileDialogOpenCommandInput): Promise<any> {
    // const window = BrowserWindow.getFocusedWindow();
    // if (!window) {
    //   throw new Error('No focused window');
    // }

    // return dialog.showOpenDialog(window, input.options);
    throw new Error('Not implemented');
  }
}
