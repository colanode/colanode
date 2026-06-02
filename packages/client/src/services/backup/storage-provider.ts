export interface StorageProviderConfig {
    type: 'github' | 's3';
    [key: string]: unknown;
}

export interface GitHubProviderConfig extends StorageProviderConfig {
    type: 'github';
    token: string;
    owner: string;
    repo: string;
}

export interface S3ProviderConfig extends StorageProviderConfig {
    type: 's3';
    accessKeyId: string;
    secretAccessKey: string;
    bucket: string;
    region?: string;
    endpoint?: string;
}

export interface StorageProvider {
    readonly name: string;
    init(): Promise<void>;
    upload(key: string, data: Buffer): Promise<void>;
    download(key: string): Promise<Buffer>;
    list(prefix: string): Promise<string[]>;
    delete(key: string): Promise<void>;
    exists(key: string): Promise<boolean>;
}
