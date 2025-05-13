import { shell } from 'electron';

import path from 'path';

import { CommandHandler } from '../../lib/types';
import { FileOpenCommandInput } from '../../commands/file-open';

export class FileOpenCommandHandler
  implements CommandHandler<FileOpenCommandInput>
{
  public async handleCommand(input: FileOpenCommandInput): Promise<void> {
    // const workspaceFilesDir = getWorkspaceFilesDirectoryPath(
    //   input.accountId,
    //   input.workspaceId
    // );

    const workspaceFilesDir = '';
    const filePath = path.join(
      workspaceFilesDir,
      `${input.fileId}${input.extension}`
    );

    shell.openPath(filePath);
  }
}
