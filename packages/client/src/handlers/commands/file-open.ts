import { FileOpenCommandInput } from '@colanode/client/commands/file-open';
import { CommandHandler } from '@colanode/client/lib/types';

export class FileOpenCommandHandler
  implements CommandHandler<FileOpenCommandInput>
{
  public async handleCommand(_input: FileOpenCommandInput): Promise<void> {
    // const workspaceFilesDir = getWorkspaceFilesDirectoryPath(
    //   input.accountId,
    //   input.workspaceId
    // );

    // const workspaceFilesDir = '';
    // const filePath = path.join(
    //   workspaceFilesDir,
    //   `${input.fileId}${input.extension}`
    // );

    // shell.openPath(filePath);
    throw new Error('Not implemented');
  }
}
