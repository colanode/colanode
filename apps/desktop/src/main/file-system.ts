import { FileSystem } from '@colanode/client/services';

import fs from 'fs';

export class DesktopFileSystem implements FileSystem {
  public async deleteDirectory(path: string): Promise<void> {
    await fs.promises.rm(path, { recursive: true, force: true });
  }
}
