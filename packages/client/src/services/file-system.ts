export interface FileMetadata {
  lastModified: number;
  size: number;
}

export interface FileSystem {
  makeDirectory(path: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  delete(path: string): Promise<void>;
  copy(source: string, destination: string): Promise<void>;
  createReadStream(path: string): Promise<ReadableStream<Uint8Array>>;
  createWriteStream(path: string): Promise<WritableStream<Uint8Array>>;
  listFiles(path: string): Promise<string[]>;
  readFile(path: string): Promise<Uint8Array>;
  writeFile(path: string, data: Uint8Array): Promise<void>;
  metadata(path: string): Promise<FileMetadata>;
}
