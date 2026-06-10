import { eq, useLiveQuery } from '@tanstack/react-db';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import type {
    BackupListItem,
    BackupProgress,
} from '@colanode/client/services/backup';
import { collections } from '@colanode/ui/collections';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@colanode/ui/components/ui/alert-dialog';
import { Button } from '@colanode/ui/components/ui/button';
import { Input } from '@colanode/ui/components/ui/input';
import { Separator } from '@colanode/ui/components/ui/separator';
import { Spinner } from '@colanode/ui/components/ui/spinner';
import { useMetadata } from '@colanode/ui/hooks/use-metadata';
import type { BackupProviderConfig } from '@colanode/ui/window';

const BACKUP_CONFIG_NAMESPACE = 'app';
const BACKUP_CONFIG_KEY = 'backup.config';

type PersistedBackupPanelConfig = {
    providerType: ProviderType;
    local: LocalFields;
    github: GitHubFields;
    s3: S3Fields;
};

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleString();
}

type ProviderType = 'local' | 'github' | 's3';

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

export const BackupPanel = () => {
    const [savedConfig, setSavedConfig] = useMetadata<PersistedBackupPanelConfig>(
        BACKUP_CONFIG_NAMESPACE,
        BACKUP_CONFIG_KEY
    );
    const [hydrated, setHydrated] = useState(false);

    const metadataQuery = useLiveQuery(
        (q) =>
            q
                .from({ metadata: collections.metadata })
                .where(
                    ({ metadata }) =>
                        eq(metadata.namespace, BACKUP_CONFIG_NAMESPACE) &&
                        eq(metadata.key, BACKUP_CONFIG_KEY)
                )
                .findOne(),
        []
    );

    const [providerType, setProviderType] = useState<ProviderType>('local');
    const [localFields, setLocalFields] = useState<LocalFields>({
        path: '',
    });
    const [githubFields, setGithubFields] = useState<GitHubFields>({
        token: '',
        owner: '',
        repo: '',
    });
    const [s3Fields, setS3Fields] = useState<S3Fields>({
        accessKeyId: '',
        secretAccessKey: '',
        bucket: '',
        region: 'us-east-1',
        endpoint: '',
    });

    const [backups, setBackups] = useState<BackupListItem[]>([]);
    const [isLoadingList, setIsLoadingList] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [progress, setProgress] = useState<BackupProgress | null>(null);
    const [restoreTarget, setRestoreTarget] = useState<string | null>(null);

    const unsubRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        if (!metadataQuery.isReady || hydrated) {
            return;
        }

        setHydrated(true);

        if (savedConfig) {
            setProviderType(savedConfig.providerType);
            setLocalFields(savedConfig.local);
            setGithubFields(savedConfig.github);
            setS3Fields(savedConfig.s3);
        }
    }, [metadataQuery.isReady, savedConfig, hydrated]);

    useEffect(() => {
        if (!hydrated) {
            return;
        }

        const timer = setTimeout(() => {
            setSavedConfig({
                providerType,
                local: localFields,
                github: githubFields,
                s3: s3Fields,
            });
        }, 500);

        return () => {
            clearTimeout(timer);
        };
    }, [
        hydrated,
        providerType,
        localFields,
        githubFields,
        s3Fields,
        setSavedConfig,
    ]);

    useEffect(() => {
        return () => {
            unsubRef.current?.();
        };
    }, []);

    const buildConfig = useCallback((): BackupProviderConfig | null => {
        if (providerType === 'local') {
            if (!localFields.path) {
                toast.error('请填写备份目录路径');
                return null;
            }
            return { type: 'local', path: localFields.path };
        }
        if (providerType === 'github') {
            if (!githubFields.token || !githubFields.owner || !githubFields.repo) {
                toast.error('请填写所有 GitHub 字段');
                return null;
            }
            return { type: 'github', ...githubFields };
        }
        if (!s3Fields.accessKeyId || !s3Fields.secretAccessKey || !s3Fields.bucket) {
            toast.error('请填写必填的 S3 字段');
            return null;
        }
        return {
            type: 's3',
            ...s3Fields,
            endpoint: s3Fields.endpoint || undefined,
        };
    }, [providerType, localFields, githubFields, s3Fields]);

    const subscribeProgress = useCallback(() => {
        unsubRef.current?.();
        unsubRef.current = window.colanode.onBackupProgress((p) => {
            setProgress(p);
        });
    }, []);

    const handleLoadBackups = useCallback(async () => {
        const config = buildConfig();
        if (!config) return;

        setIsLoadingList(true);
        try {
            const list = await window.colanode.backupList(config);
            setBackups(list);
            if (list.length === 0) {
                toast.info('暂无备份');
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : '加载备份列表失败');
        } finally {
            setIsLoadingList(false);
        }
    }, [buildConfig]);

    const handleCreateBackup = useCallback(async () => {
        const config = buildConfig();
        if (!config) return;

        setIsCreating(true);
        setProgress(null);
        subscribeProgress();

        try {
            const { backupId } = await window.colanode.backupCreate(config);
            toast.success(`备份创建成功: ${backupId}`);
            // Refresh list
            const list = await window.colanode.backupList(config);
            setBackups(list);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : '备份创建失败');
        } finally {
            setIsCreating(false);
            setProgress(null);
            unsubRef.current?.();
        }
    }, [buildConfig, subscribeProgress]);

    const handleRestore = useCallback(
        async (backupId: string) => {
            const config = buildConfig();
            if (!config) return;

            setIsRestoring(true);
            setProgress(null);
            setRestoreTarget(null);
            subscribeProgress();

            try {
                await window.colanode.backupRestore({ config, backupId });
                // App will relaunch after restore, so this may not be reached
                toast.success('恢复完成，应用即将重启');
            } catch (err) {
                toast.error(err instanceof Error ? err.message : '恢复失败');
            } finally {
                setIsRestoring(false);
                setProgress(null);
                unsubRef.current?.();
            }
        },
        [buildConfig, subscribeProgress]
    );

    const isWorking = isCreating || isRestoring;

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-lg font-semibold tracking-tight">
                    Backup &amp; Restore
                </h2>
                <Separator className="mt-2" />
            </div>

            {/* Provider selector */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <Button
                        variant={providerType === 'local' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setProviderType('local')}
                        disabled={isWorking}
                    >
                        Local
                    </Button>
                    <Button
                        variant={providerType === 'github' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setProviderType('github')}
                        disabled={isWorking}
                    >
                        GitHub Releases
                    </Button>
                    <Button
                        variant={providerType === 's3' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setProviderType('s3')}
                        disabled={isWorking}
                    >
                        S3
                    </Button>
                </div>

                {/* Local fields */}
                {providerType === 'local' && (
                    <div className="grid grid-cols-[100px_1fr] gap-x-3 gap-y-2 items-center">
                        <label className="text-sm text-muted-foreground">Path</label>
                        <div className="flex items-center gap-2">
                            <Input
                                placeholder="/path/to/backup"
                                value={localFields.path}
                                onChange={(e) =>
                                    setLocalFields((f) => ({ ...f, path: e.target.value }))
                                }
                                disabled={isWorking}
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={isWorking}
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

                {/* GitHub fields */}
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
                            disabled={isWorking}
                        />
                        <label className="text-sm text-muted-foreground">Owner</label>
                        <Input
                            placeholder="username or org"
                            value={githubFields.owner}
                            onChange={(e) =>
                                setGithubFields((f) => ({ ...f, owner: e.target.value }))
                            }
                            disabled={isWorking}
                        />
                        <label className="text-sm text-muted-foreground">Repo</label>
                        <Input
                            placeholder="repository name"
                            value={githubFields.repo}
                            onChange={(e) =>
                                setGithubFields((f) => ({ ...f, repo: e.target.value }))
                            }
                            disabled={isWorking}
                        />
                    </div>
                )}

                {/* S3 fields */}
                {providerType === 's3' && (
                    <div className="grid grid-cols-[120px_1fr] gap-x-3 gap-y-2 items-center">
                        <label className="text-sm text-muted-foreground">Access Key</label>
                        <Input
                            type="password"
                            value={s3Fields.accessKeyId}
                            onChange={(e) =>
                                setS3Fields((f) => ({ ...f, accessKeyId: e.target.value }))
                            }
                            disabled={isWorking}
                        />
                        <label className="text-sm text-muted-foreground">Secret Key</label>
                        <Input
                            type="password"
                            value={s3Fields.secretAccessKey}
                            onChange={(e) =>
                                setS3Fields((f) => ({
                                    ...f,
                                    secretAccessKey: e.target.value,
                                }))
                            }
                            disabled={isWorking}
                        />
                        <label className="text-sm text-muted-foreground">Bucket</label>
                        <Input
                            value={s3Fields.bucket}
                            onChange={(e) =>
                                setS3Fields((f) => ({ ...f, bucket: e.target.value }))
                            }
                            disabled={isWorking}
                        />
                        <label className="text-sm text-muted-foreground">Region</label>
                        <Input
                            placeholder="us-east-1"
                            value={s3Fields.region}
                            onChange={(e) =>
                                setS3Fields((f) => ({ ...f, region: e.target.value }))
                            }
                            disabled={isWorking}
                        />
                        <label className="text-sm text-muted-foreground">Endpoint</label>
                        <Input
                            placeholder="https://... (optional)"
                            value={s3Fields.endpoint}
                            onChange={(e) =>
                                setS3Fields((f) => ({ ...f, endpoint: e.target.value }))
                            }
                            disabled={isWorking}
                        />
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
                <Button
                    onClick={handleCreateBackup}
                    disabled={isWorking}
                >
                    {isCreating ? (
                        <>
                            <Spinner className="mr-2" />
                            Creating...
                        </>
                    ) : (
                        'Create backup'
                    )}
                </Button>
                <Button
                    variant="outline"
                    onClick={handleLoadBackups}
                    disabled={isWorking || isLoadingList}
                >
                    {isLoadingList ? (
                        <>
                            <Spinner className="mr-2" />
                            Loading...
                        </>
                    ) : (
                        'Load backups'
                    )}
                </Button>
            </div>

            {/* Progress */}
            {progress && progress.phase !== 'done' && (
                <div className="rounded-md border p-3 space-y-1">
                    <p className="text-sm font-medium">
                        {progress.phase === 'scanning' && 'Scanning files...'}
                        {progress.phase === 'uploading' && 'Uploading...'}
                        {progress.phase === 'downloading' && 'Downloading...'}
                        {progress.phase === 'restoring' && 'Restoring...'}
                    </p>
                    {progress.total > 0 && (
                        <p className="text-sm text-muted-foreground">
                            {progress.current} / {progress.total}
                            {progress.currentFile && ` — ${progress.currentFile}`}
                        </p>
                    )}
                </div>
            )}

            {/* Backup list */}
            {backups.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-sm font-medium">Available backups</h3>
                    <div className="space-y-1">
                        {backups.map((b) => (
                            <div
                                key={b.id}
                                className="flex items-center justify-between rounded-md border px-3 py-2"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-mono truncate">{b.id}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatDate(b.createdAt)} · {b.fileCount} files ·{' '}
                                        {formatBytes(b.totalSize)}
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={isWorking}
                                    onClick={() => setRestoreTarget(b.id)}
                                >
                                    Restore
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Restore confirmation dialog */}
            <AlertDialog
                open={restoreTarget !== null}
                onOpenChange={(open) => {
                    if (!open) setRestoreTarget(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认恢复</AlertDialogTitle>
                        <AlertDialogDescription>
                            恢复将覆盖当前本地数据，并在完成后自动重启应用。此操作不可撤销。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (restoreTarget) {
                                    handleRestore(restoreTarget);
                                }
                            }}
                        >
                            确认恢复
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
