export interface FileSystem {
  deleteDirectory(path: string): Promise<void>;
}
