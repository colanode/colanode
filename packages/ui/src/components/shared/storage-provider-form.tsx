import { useEffect, useState } from 'react';

import type {
    GitHubProviderConfig,
    LocalProviderConfig,
    S3ProviderConfig,
} from '@colanode/client/services/backup';
import { Button } from '@colanode/ui/components/ui/button';
import { Input } from '@colanode/ui/components/ui/input';

export type StorageProviderConfig =
    | LocalProviderConfig
    | GitHubProviderConfig
    | S3ProviderConfig;

export type StorageProviderType = StorageProviderConfig['type'];

interface LocalFields {
    path: string;
}

interface GitHubFields {
    token: string;
    owner: string;
    repo: string;
}

interface S3Fields {
    accessKeyId: string;
    secretAccessKey: string;
    bucket: string;
    region: string;
    endpoint: string;
}

const EMPTY_LOCAL: LocalFields = { path: '' };
const EMPTY_GITHUB: GitHubFields = { token: '', owner: '', repo: '' };
const EMPTY_S3: S3Fields = {
    accessKeyId: '',
    secretAccessKey: '',
    bucket: '',
    region: 'us-east-1',
    endpoint: '',
};

interface StorageProviderFormProps {
    value: StorageProviderConfig | null;
    onChange: (value: StorageProviderConfig | null) => void;
    disabled?: boolean;
    allowedTypes?: StorageProviderType[];
}

const seedLocal = (value: StorageProviderConfig | null): LocalFields =>
    value?.type === 'local' ? { path: value.path } : EMPTY_LOCAL;

const seedGitHub = (value: StorageProviderConfig | null): GitHubFields =>
    value?.type === 'github'
        ? { token: value.token, owner: value.owner, repo: value.repo }
        : EMPTY_GITHUB;

const seedS3 = (value: StorageProviderConfig | null): S3Fields =>
    value?.type === 's3'
        ? {
            accessKeyId: value.accessKeyId,
            secretAccessKey: value.secretAccessKey,
            bucket: value.bucket,
            region: value.region ?? 'us-east-1',
            endpoint: value.endpoint ?? '',
        }
        : EMPTY_S3;

export const StorageProviderForm = ({
    value,
    onChange,
    disabled,
    allowedTypes = ['local', 'github', 's3'],
}: StorageProviderFormProps) => {
    const initialType: StorageProviderType =
        value?.type && allowedTypes.includes(value.type)
            ? value.type
            : (allowedTypes[0] ?? 'local');

    const [providerType, setProviderType] =
        useState<StorageProviderType>(initialType);
    const [localFields, setLocalFields] = useState<LocalFields>(() =>
        seedLocal(value)
    );
    const [githubFields, setGithubFields] = useState<GitHubFields>(() =>
        seedGitHub(value)
    );
    const [s3Fields, setS3Fields] = useState<S3Fields>(() => seedS3(value));

    useEffect(() => {
        if (providerType === 'local') {
            if (!localFields.path) {
                onChange(null);
                return;
            }
            onChange({ type: 'local', path: localFields.path });
            return;
        }
        if (providerType === 'github') {
            if (!githubFields.token || !githubFields.owner || !githubFields.repo) {
                onChange(null);
                return;
            }
            onChange({ type: 'github', ...githubFields });
            return;
        }
        if (
            !s3Fields.accessKeyId ||
            !s3Fields.secretAccessKey ||
            !s3Fields.bucket
        ) {
            onChange(null);
            return;
        }
        onChange({
            type: 's3',
            accessKeyId: s3Fields.accessKeyId,
            secretAccessKey: s3Fields.secretAccessKey,
            bucket: s3Fields.bucket,
            region: s3Fields.region || undefined,
            endpoint: s3Fields.endpoint || undefined,
        });
    }, [providerType, localFields, githubFields, s3Fields, onChange]);

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                {allowedTypes.includes('local') && (
                    <Button
                        variant={providerType === 'local' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setProviderType('local')}
                        disabled={disabled}
                    >
                        Local
                    </Button>
                )}
                {allowedTypes.includes('github') && (
                    <Button
                        variant={providerType === 'github' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setProviderType('github')}
                        disabled={disabled}
                    >
                        GitHub Releases
                    </Button>
                )}
                {allowedTypes.includes('s3') && (
                    <Button
                        variant={providerType === 's3' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setProviderType('s3')}
                        disabled={disabled}
                    >
                        S3
                    </Button>
                )}
            </div>

            {providerType === 'local' && (
                <div className="grid grid-cols-[100px_1fr] gap-x-3 gap-y-2 items-center">
                    <label className="text-sm text-muted-foreground">Path</label>
                    <div className="flex items-center gap-2">
                        <Input
                            placeholder="/path/to/storage"
                            value={localFields.path}
                            onChange={(e) =>
                                setLocalFields((f) => ({ ...f, path: e.target.value }))
                            }
                            disabled={disabled}
                        />
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={disabled}
                            onClick={async () => {
                                const dir =
                                    await window.colanode.showStorageDirectoryDialog();
                                if (dir) {
                                    setLocalFields({ path: dir });
                                }
                            }}
                        >
                            Browse
                        </Button>
                    </div>
                </div>
            )}

            {providerType === 'github' && (
                <div className="grid grid-cols-[100px_1fr] gap-x-3 gap-y-2 items-center">
                    <label className="text-sm text-muted-foreground">Token</label>
                    <Input
                        type="password"
                        placeholder="ghp_..."
                        value={githubFields.token}
                        onChange={(e) =>
                            setGithubFields((f) => ({ ...f, token: e.target.value }))
                        }
                        disabled={disabled}
                    />
                    <label className="text-sm text-muted-foreground">Owner</label>
                    <Input
                        placeholder="username or org"
                        value={githubFields.owner}
                        onChange={(e) =>
                            setGithubFields((f) => ({ ...f, owner: e.target.value }))
                        }
                        disabled={disabled}
                    />
                    <label className="text-sm text-muted-foreground">Repo</label>
                    <Input
                        placeholder="repository name"
                        value={githubFields.repo}
                        onChange={(e) =>
                            setGithubFields((f) => ({ ...f, repo: e.target.value }))
                        }
                        disabled={disabled}
                    />
                </div>
            )}

            {providerType === 's3' && (
                <div className="grid grid-cols-[120px_1fr] gap-x-3 gap-y-2 items-center">
                    <label className="text-sm text-muted-foreground">Access Key</label>
                    <Input
                        type="password"
                        value={s3Fields.accessKeyId}
                        onChange={(e) =>
                            setS3Fields((f) => ({ ...f, accessKeyId: e.target.value }))
                        }
                        disabled={disabled}
                    />
                    <label className="text-sm text-muted-foreground">Secret Key</label>
                    <Input
                        type="password"
                        value={s3Fields.secretAccessKey}
                        onChange={(e) =>
                            setS3Fields((f) => ({ ...f, secretAccessKey: e.target.value }))
                        }
                        disabled={disabled}
                    />
                    <label className="text-sm text-muted-foreground">Bucket</label>
                    <Input
                        value={s3Fields.bucket}
                        onChange={(e) =>
                            setS3Fields((f) => ({ ...f, bucket: e.target.value }))
                        }
                        disabled={disabled}
                    />
                    <label className="text-sm text-muted-foreground">Region</label>
                    <Input
                        placeholder="us-east-1"
                        value={s3Fields.region}
                        onChange={(e) =>
                            setS3Fields((f) => ({ ...f, region: e.target.value }))
                        }
                        disabled={disabled}
                    />
                    <label className="text-sm text-muted-foreground">Endpoint</label>
                    <Input
                        placeholder="https://... (optional)"
                        value={s3Fields.endpoint}
                        onChange={(e) =>
                            setS3Fields((f) => ({ ...f, endpoint: e.target.value }))
                        }
                        disabled={disabled}
                    />
                </div>
            )}
        </div>
    );
};
