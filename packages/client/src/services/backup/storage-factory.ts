import { GitHubStorageProvider } from './github-provider';
import { LocalStorageProvider } from './local-provider';
import { S3StorageProvider } from './s3-provider';
import {
    GitHubProviderConfig,
    LocalProviderConfig,
    S3ProviderConfig,
    StorageProvider,
} from './storage-provider';

export type StorageProviderInput =
    | LocalProviderConfig
    | S3ProviderConfig
    | GitHubProviderConfig;

export const createStorageProvider = (
    config: StorageProviderInput
): StorageProvider => {
    switch (config.type) {
        case 'github':
            return new GitHubStorageProvider(config);
        case 's3':
            return new S3StorageProvider(config);
        case 'local':
            return new LocalStorageProvider(config);
        default:
            throw new Error(
                `Unknown storage provider type: ${(config as { type: string }).type}`
            );
    }
};
