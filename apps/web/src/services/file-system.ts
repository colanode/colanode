import { FileSystem } from '@colanode/client/services';

export class WebFileSystem implements FileSystem {
  public async deleteDirectory(_path: string): Promise<void> {
    throw new Error('Not implemented');
  }
}
