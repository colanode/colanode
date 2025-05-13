import { BrowserWindow, dialog } from 'electron';

import { CommandHandler } from '../../lib/types';
import { FileDialogOpenCommandInput } from '../../commands/file-dialog-open';

export class FileDialogOpenCommandHandler
  implements CommandHandler<FileDialogOpenCommandInput>
{
  public async handleCommand(
    input: FileDialogOpenCommandInput
  ): Promise<Electron.OpenDialogReturnValue> {
    const window = BrowserWindow.getFocusedWindow();
    if (!window) {
      throw new Error('No focused window');
    }

    return dialog.showOpenDialog(window, input.options);
  }
}
