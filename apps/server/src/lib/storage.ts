import { Readable } from 'stream';
import { createReadStream, createWriteStream, promises as fs } from 'fs';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Storage } from '@google-cloud/storage';
import {
  BlobServiceClient,
  StorageSharedKeyCredential,
} from '@azure/storage-blob';
import { config } from '@colanode/server/lib/config';

export interface StorageBackend {
  download(path: string): Promise<{ stream: Readable; contentType?: string }>;
  delete(path: string): Promise<void>;
  upload(
    path: string,
    data: Buffer | Readable,
    contentType: string,
    contentLength?: bigint
  ): Promise<void>;
}

class S3Storage implements StorageBackend {
  private client: S3Client;
  private bucket: string;

  constructor() {
    const storageConfig = config.storage;
    if (storageConfig.type !== 's3') {
      throw new Error('Invalid storage configuration for S3Storage');
    }

    this.client = new S3Client({
      endpoint: storageConfig.endpoint,
      region: storageConfig.region,
      credentials: {
        accessKeyId: storageConfig.accessKey,
        secretAccessKey: storageConfig.secretKey,
      },
      forcePathStyle: storageConfig.forcePathStyle,
    });
    this.bucket = storageConfig.bucket;
  }

  async download(
    path: string
  ): Promise<{ stream: Readable; contentType?: string }> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: path,
    });

    const response = await this.client.send(command);
    if (!response.Body || !(response.Body instanceof Readable)) {
      throw new Error('File not found or invalid response body');
    }

    return {
      stream: response.Body,
      contentType: response.ContentType,
    };
  }

  async delete(path: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: path,
    });

    await this.client.send(command);
  }

  async upload(
    path: string,
    data: Buffer | Readable,
    contentType: string,
    contentLength?: bigint
  ): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: path,
      Body: data,
      ContentType: contentType,
      ContentLength: contentLength ? Number(contentLength) : undefined,
    });

    await this.client.send(command);
  }
}

class FileStorage implements StorageBackend {
  private directory: string;

  constructor() {
    const storageConfig = config.storage;
    if (storageConfig.type !== 'file') {
      throw new Error('Invalid storage configuration for FileStorage');
    }

    this.directory = storageConfig.directory;
  }

  async download(
    path: string
  ): Promise<{ stream: Readable; contentType?: string }> {
    const fullPath = `${this.directory}/${path}`;
    const stream = createReadStream(fullPath);

    return {
      stream,
      contentType: undefined, // File storage doesn't store content type
    };
  }

  async delete(path: string): Promise<void> {
    const fullPath = `${this.directory}/${path}`;
    await fs.unlink(fullPath);
  }

  async upload(
    path: string,
    data: Buffer | Readable,
    _contentType: string,
    _contentLength?: bigint
  ): Promise<void> {
    const fullPath = `${this.directory}/${path}`;
    // Ensure directory exists
    const dirPath = fullPath.substring(0, fullPath.lastIndexOf('/'));
    await fs.mkdir(dirPath, { recursive: true });

    if (data instanceof Buffer) {
      await fs.writeFile(fullPath, data);
    } else {
      // Handle stream
      const writeStream = createWriteStream(fullPath);
      const stream = data as Readable;
      await new Promise<void>((resolve, reject) => {
        stream.pipe(writeStream);
        writeStream.on('finish', () => resolve());
        writeStream.on('error', reject);
      });
    }
  }
}

class GCSStorage implements StorageBackend {
  private bucket: any;

  constructor() {
    const storageConfig = config.storage;
    if (storageConfig.type !== 'gcs') {
      throw new Error('Invalid storage configuration for GCSStorage');
    }

    const storage = new Storage({
      projectId: storageConfig.projectId,
      keyFilename: storageConfig.credentials,
    });

    this.bucket = storage.bucket(storageConfig.bucket);
  }

  async download(
    path: string
  ): Promise<{ stream: Readable; contentType?: string }> {
    const file = this.bucket.file(path);
    const [metadata] = await file.getMetadata();
    const stream = file.createReadStream();

    return {
      stream,
      contentType: metadata.contentType,
    };
  }

  async delete(path: string): Promise<void> {
    const file = this.bucket.file(path);
    await file.delete();
  }

  async upload(
    path: string,
    data: Buffer | Readable,
    contentType: string,
    _contentLength?: bigint
  ): Promise<void> {
    const file = this.bucket.file(path);

    if (data instanceof Buffer) {
      await file.save(data, {
        contentType,
      });
    } else {
      // Handle stream
      const writeStream = file.createWriteStream({
        metadata: {
          contentType,
        },
      });

      const stream = data as Readable;
      await new Promise<void>((resolve, reject) => {
        stream.pipe(writeStream);
        writeStream.on('finish', () => resolve());
        writeStream.on('error', reject);
      });
    }
  }
}

class AzureStorage implements StorageBackend {
  private blobServiceClient: BlobServiceClient;
  private containerName: string;

  constructor() {
    const storageConfig = config.storage;
    if (storageConfig.type !== 'azure') {
      throw new Error('Invalid storage configuration for AzureStorage');
    }

    const sharedKeyCredential = new StorageSharedKeyCredential(
      storageConfig.account,
      storageConfig.accountKey
    );

    this.blobServiceClient = new BlobServiceClient(
      `https://${storageConfig.account}.blob.core.windows.net`,
      sharedKeyCredential
    );
    this.containerName = storageConfig.containerName;
  }

  async download(
    path: string
  ): Promise<{ stream: Readable; contentType?: string }> {
    const containerClient = this.blobServiceClient.getContainerClient(
      this.containerName
    );
    const blobClient = containerClient.getBlobClient(path);
    const downloadResponse = await blobClient.download();

    if (!downloadResponse.readableStreamBody) {
      throw new Error('Failed to download blob: no readable stream body');
    }

    return {
      stream: downloadResponse.readableStreamBody as Readable,
      contentType: downloadResponse.contentType,
    };
  }

  async delete(path: string): Promise<void> {
    const containerClient = this.blobServiceClient.getContainerClient(
      this.containerName
    );
    const blobClient = containerClient.getBlobClient(path);
    await blobClient.delete();
  }

  async upload(
    path: string,
    data: Buffer | Readable,
    contentType: string,
    contentLength?: bigint
  ): Promise<void> {
    const containerClient = this.blobServiceClient.getContainerClient(
      this.containerName
    );
    const blockBlobClient = containerClient.getBlockBlobClient(path);

    if (data instanceof Buffer) {
      await blockBlobClient.upload(data, data.length, {
        blobHTTPHeaders: {
          blobContentType: contentType,
        },
      });
    } else {
      // Handle stream - Azure SDK requires content length for streams
      if (!contentLength) {
        throw new Error(
          'Content length is required for stream uploads to Azure'
        );
      }

      await blockBlobClient.uploadStream(
        data as Readable,
        undefined,
        undefined,
        {
          blobHTTPHeaders: {
            blobContentType: contentType,
          },
        }
      );
    }
  }
}

let storageInstance: StorageBackend | null = null;

export const getStorage = (): StorageBackend => {
  if (storageInstance) {
    return storageInstance;
  }

  const storageConfig = config.storage;

  switch (storageConfig.type) {
    case 's3':
      storageInstance = new S3Storage();
      break;
    case 'file':
      storageInstance = new FileStorage();
      break;
    case 'gcs':
      storageInstance = new GCSStorage();
      break;
    case 'azure':
      storageInstance = new AzureStorage();
      break;
    default:
      throw new Error(
        `Unsupported storage type: ${(storageConfig as any).type}`
      );
  }

  return storageInstance;
};
