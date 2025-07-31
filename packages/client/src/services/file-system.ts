export type FileReadStream = Buffer | File;

export interface FileSystem {
  makeDirectory(path: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  delete(path: string): Promise<void>;
  copy(source: string, destination: string): Promise<void>;
  readStream(path: string): Promise<FileReadStream>;
  writeStream(path: string): Promise<WritableStream<Uint8Array>>;
  listFiles(path: string): Promise<string[]>;
  readFile(path: string): Promise<Uint8Array>;
  writeFile(path: string, data: Uint8Array): Promise<void>;
  url(path: string): Promise<string>;
}
