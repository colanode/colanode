// import path from 'path';
// import fs from 'fs';

import { WorkspaceMutationHandlerBase } from '@colanode/client/handlers/mutations/workspace-mutation-handler-base';
import { MutationHandler } from '@colanode/client/lib/types';
import {
  FileSaveTempMutationInput,
  FileSaveTempMutationOutput,
} from '@colanode/client/mutations';

export class FileSaveTempMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<FileSaveTempMutationInput>
{
  async handleMutation(
    _: FileSaveTempMutationInput
  ): Promise<FileSaveTempMutationOutput> {
    throw new Error('Not implemented');

    // const workspace = this.getWorkspace(input.accountId, input.workspaceId);
    // const directoryPath = this.app.paths.workspaceTempFiles(
    //   workspace.accountId,
    //   workspace.id
    // );

    // const fileName = this.generateUniqueName(directoryPath, input.name);
    // const filePath = path.join(directoryPath, fileName);

    // if (!fs.existsSync(directoryPath)) {
    //   fs.mkdirSync(directoryPath, { recursive: true });
    // }

    // const buffer = Buffer.from(input.buffer);
    // fs.writeFileSync(filePath, buffer);

    // return {
    //   path: filePath,
    // };
  }

  // private generateUniqueName(directoryPath: string, name: string): string {
  //   let result = name;
  //   let counter = 1;
  //   while (fs.existsSync(path.join(directoryPath, result))) {
  //     const nameWithoutExtension = path.basename(name, path.extname(name));
  //     const extension = path.extname(name);
  //     result = `${nameWithoutExtension}_${counter}${extension}`;
  //     counter++;
  //   }

  //   return result;
  // }
}
