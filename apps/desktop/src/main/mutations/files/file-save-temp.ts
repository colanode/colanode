import path from 'path';
import fs from 'fs';

import { MutationHandler } from '@/main/types';
import {
  FileSaveTempMutationInput,
  FileSaveTempMutationOutput,
} from '@/shared/mutations/files/file-save-temp';
import { getWorkspaceTempFilesDirectoryPath } from '@/main/utils';

export class FileSaveTempMutationHandler
  implements MutationHandler<FileSaveTempMutationInput>
{
  async handleMutation(
    input: FileSaveTempMutationInput
  ): Promise<FileSaveTempMutationOutput> {
    const directoryPath = getWorkspaceTempFilesDirectoryPath(input.userId);

    const fileName = this.generateUniqueName(directoryPath, input.name);
    const filePath = path.join(directoryPath, fileName);

    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
    }

    const buffer = Buffer.from(input.buffer);
    fs.writeFileSync(filePath, buffer);

    return {
      path: filePath,
    };
  }

  private generateUniqueName(directoryPath: string, name: string): string {
    let result = name;
    let counter = 1;
    while (fs.existsSync(path.join(directoryPath, result))) {
      const nameWithoutExtension = path.basename(name, path.extname(name));
      const extension = path.extname(name);
      result = `${nameWithoutExtension}_${counter}${extension}`;
      counter++;
    }

    return result;
  }
}