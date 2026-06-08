import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import type { LocalSyncConfig } from '@colanode/client/services';
import {
    LocalSyncExportSummary,
    LocalSyncImportSummary,
    LocalSyncStatus,
} from '@colanode/client/types';
import {
    StorageProviderConfig,
    StorageProviderForm,
} from '@colanode/ui/components/shared/storage-provider-form';
import { Badge } from '@colanode/ui/components/ui/badge';
import { Button } from '@colanode/ui/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@colanode/ui/components/ui/dialog';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useMutation } from '@colanode/ui/hooks/use-mutation';
import { useQuery } from '@colanode/ui/hooks/use-query';

const formatTimestamp = (value: string | null): string => {
    if (!value) {
        return '—';
    }
    try {
        return new Date(value).toLocaleString();
    } catch {
        return value;
    }
};

const formatExportSummary = (
    summary: LocalSyncExportSummary | null
): string => {
    if (!summary) {
        return '';
    }
    const total =
        summary.nodeUpdates +
        summary.documentUpdates +
        summary.reactions +
        summary.deletes +
        summary.files;
    if (total === 0) {
        return 'no changes';
    }
    const parts: string[] = [];
    if (summary.nodeUpdates) parts.push(`${summary.nodeUpdates} updates`);
    if (summary.documentUpdates) parts.push(`${summary.documentUpdates} docs`);
    if (summary.reactions) parts.push(`${summary.reactions} reactions`);
    if (summary.deletes) parts.push(`${summary.deletes} deletes`);
    if (summary.files) parts.push(`${summary.files} files`);
    return parts.join(' · ');
};

const formatImportSummary = (
    summary: LocalSyncImportSummary | null
): string => {
    if (!summary) {
        return '';
    }
    const total =
        summary.nodeUpdates +
        summary.documentUpdates +
        summary.reactions +
        summary.deletes;
    if (total === 0) {
        return 'no changes';
    }
    const parts: string[] = [];
    if (summary.nodeUpdates) parts.push(`${summary.nodeUpdates} updates`);
    if (summary.documentUpdates) parts.push(`${summary.documentUpdates} docs`);
    if (summary.reactions) parts.push(`${summary.reactions} reactions`);
    if (summary.deletes) parts.push(`${summary.deletes} deletes`);
    return parts.join(' · ');
};

const renderBadge = (status: LocalSyncStatus) => {
    if (!status.enabled) {
        return <Badge variant="outline">Disabled</Badge>;
    }
    if (status.paused) {
        return <Badge variant="outline">Paused</Badge>;
    }
    if (status.lastExportError || status.lastImportError) {
        return <Badge variant="destructive">Error</Badge>;
    }
    if (status.isRunning) {
        return <Badge variant="secondary">Syncing…</Badge>;
    }
    return <Badge>Idle</Badge>;
};

export const WorkspaceLocalSync = () => {
    const workspace = useWorkspace();
    const statusQuery = useQuery({
        type: 'local.sync.status.get',
        userId: workspace.userId,
    });
    const { mutate, isPending } = useMutation();

    const [config, setConfig] = useState<LocalSyncConfig | null>(null);
    const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
    const [draftConfig, setDraftConfig] =
        useState<StorageProviderConfig | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const refreshConfig = useCallback(async () => {
        try {
            const current = await window.colanode.localSyncGetConfig();
            setConfig(current);
        } catch {
            // ignore — handled when interacting
        }
    }, []);

    useEffect(() => {
        void refreshConfig();
    }, [refreshConfig]);

    const status = statusQuery.data ?? null;

    const openConfigure = () => {
        setDraftConfig(
            (config?.storage as StorageProviderConfig | undefined) ?? null
        );
        setIsConfigDialogOpen(true);
    };

    const closeConfigure = () => {
        if (isSaving) return;
        setIsConfigDialogOpen(false);
    };

    const saveConfigure = async () => {
        if (!draftConfig) {
            toast.error('Please fill in the storage configuration');
            return;
        }

        setIsSaving(true);
        try {
            const saved = await window.colanode.localSyncConfigure(draftConfig);
            const normalizedPath =
                saved.storage.type === 'local' &&
                    draftConfig.type === 'local' &&
                    saved.storage.path !== draftConfig.path
                    ? saved.storage.path
                    : null;
            toast.success(
                normalizedPath
                    ? `Local sync configured at ${normalizedPath}`
                    : 'Local sync configured'
            );
            setIsConfigDialogOpen(false);
            await refreshConfig();
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : 'Failed to configure local sync'
            );
        } finally {
            setIsSaving(false);
        }
    };

    const disableSync = async () => {
        if (!confirm('Disable peer-to-peer local sync on this device?')) {
            return;
        }
        try {
            await window.colanode.localSyncClear();
            toast.success('Local sync disabled');
            await refreshConfig();
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : 'Failed to disable local sync'
            );
        }
    };

    const configDialog = (
        <Dialog open={isConfigDialogOpen} onOpenChange={(open) => {
            if (!open) closeConfigure();
        }}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Configure local sync storage</DialogTitle>
                </DialogHeader>
                <div className="py-2 space-y-3">
                    <p className="text-xs text-muted-foreground">
                        Tip: if you pick a folder that also hosts your backups, a{' '}
                        <code className="font-mono">sync/</code> subfolder will be
                        created so the two never collide.
                    </p>
                    <StorageProviderForm
                        value={draftConfig}
                        onChange={setDraftConfig}
                        disabled={isSaving}
                    />
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={closeConfigure}
                        disabled={isSaving}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={saveConfigure}
                        disabled={isSaving || !draftConfig}
                    >
                        {isSaving ? 'Saving…' : 'Save'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );

    if (!status && !config) {
        return (
            <div className="space-y-3 text-sm">
                <p className="text-muted-foreground">
                    Peer-to-peer local sync is not configured for this device.
                    Choose a shared storage location to enable syncing between
                    your devices.
                </p>
                <Button size="sm" onClick={openConfigure}>
                    Configure storage
                </Button>
                {configDialog}
            </div>
        );
    }

    if (!status) {
        return (
            <div className="space-y-3 text-sm">
                <p className="text-muted-foreground">
                    Local sync storage is configured but not yet initialized for
                    this workspace.
                </p>
                <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={openConfigure}>
                        Reconfigure
                    </Button>
                    <Button size="sm" variant="outline" onClick={disableSync}>
                        Disable
                    </Button>
                </div>
                {configDialog}
            </div>
        );
    }

    const triggerSyncNow = () => {
        mutate({
            input: {
                type: 'local.sync.trigger',
                userId: workspace.userId,
            },
            onSuccess(output) {
                if (output.success) {
                    toast.success('Sync triggered');
                }
            },
            onError(error) {
                toast.error(error.message);
            },
        });
    };

    const togglePause = () => {
        mutate({
            input: {
                type: 'local.sync.set-paused',
                userId: workspace.userId,
                paused: !status.paused,
            },
            onError(error) {
                toast.error(error.message);
            },
        });
    };

    const importSummary = formatImportSummary(status.lastImportSummary);
    const exportSummary = formatExportSummary(status.lastExportSummary);

    return (
        <div className="space-y-4 text-sm">
            <div className="flex items-center gap-3">
                <span className="font-medium">Status</span>
                {renderBadge(status)}
            </div>

            {status.identityDrift ? (
                <div className="border-destructive/50 bg-destructive/10 text-destructive space-y-1 rounded-md border p-3">
                    <p className="font-medium">Workspace identity mismatch</p>
                    <p className="text-xs">
                        This device&apos;s workspace ID does not match the shared
                        manifest, so sync has been disabled to prevent data
                        corruption. Reset this device&apos;s local data and rejoin
                        the workspace, or remove the shared manifest if this
                        device should become the new authority.
                    </p>
                    <dl className="text-muted-foreground mt-2 grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 text-xs">
                        <dt>Local workspace</dt>
                        <dd className="text-foreground font-mono break-all">
                            {status.identityDrift.localWorkspaceId}
                        </dd>
                        <dt>Manifest workspace</dt>
                        <dd className="text-foreground font-mono break-all">
                            {status.identityDrift.manifestWorkspaceId}
                        </dd>
                        <dt>Local user</dt>
                        <dd className="text-foreground font-mono break-all">
                            {status.identityDrift.localUserId}
                        </dd>
                        <dt>Manifest user</dt>
                        <dd className="text-foreground font-mono break-all">
                            {status.identityDrift.manifestUserId}
                        </dd>
                    </dl>
                </div>
            ) : null}

            <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2">
                <dt className="text-muted-foreground">Device ID</dt>
                <dd className="font-mono break-all">{status.deviceId}</dd>

                <dt className="text-muted-foreground">Storage</dt>
                <dd className="break-all">{status.storageDescription}</dd>

                <dt className="text-muted-foreground">Last export</dt>
                <dd>
                    {formatTimestamp(status.lastExportAt)}
                    {exportSummary ? (
                        <span className="text-muted-foreground ml-2 text-xs">
                            ({exportSummary})
                        </span>
                    ) : null}
                </dd>

                {status.lastExportError ? (
                    <>
                        <dt className="text-muted-foreground">Export error</dt>
                        <dd className="text-destructive break-words">
                            {status.lastExportError}
                        </dd>
                    </>
                ) : null}

                <dt className="text-muted-foreground">Last import</dt>
                <dd>
                    {formatTimestamp(status.lastImportAt)}
                    {importSummary ? (
                        <span className="text-muted-foreground ml-2 text-xs">
                            ({importSummary})
                        </span>
                    ) : null}
                </dd>

                {status.lastImportError ? (
                    <>
                        <dt className="text-muted-foreground">Import error</dt>
                        <dd className="text-destructive break-words">
                            {status.lastImportError}
                        </dd>
                    </>
                ) : null}
            </dl>

            <div className="flex flex-wrap gap-2 pt-2">
                <Button
                    type="button"
                    size="sm"
                    onClick={triggerSyncNow}
                    disabled={!status.enabled || isPending || status.isRunning}
                >
                    Sync now
                </Button>
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={togglePause}
                    disabled={!status.enabled || isPending}
                >
                    {status.paused ? 'Resume' : 'Pause'}
                </Button>
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={openConfigure}
                >
                    Reconfigure
                </Button>
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={disableSync}
                >
                    Disable
                </Button>
            </div>

            {configDialog}
        </div>
    );
};
