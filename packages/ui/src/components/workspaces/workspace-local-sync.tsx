import { toast } from 'sonner';

import { LocalSyncStatus, LocalSyncSummary } from '@colanode/client/types';
import { Badge } from '@colanode/ui/components/ui/badge';
import { Button } from '@colanode/ui/components/ui/button';
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

const formatSummary = (summary: LocalSyncSummary | null): string => {
    if (!summary) {
        return '';
    }
    const parts = [
        `${summary.nodeUpdates} update${summary.nodeUpdates === 1 ? '' : 's'}`,
        `${summary.documentUpdates} doc${summary.documentUpdates === 1 ? '' : 's'}`,
        `${summary.reactions} reaction${summary.reactions === 1 ? '' : 's'}`,
        `${summary.deletes} delete${summary.deletes === 1 ? '' : 's'}`,
        `${summary.files} file${summary.files === 1 ? '' : 's'}`,
    ];
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

    const status = statusQuery.data ?? null;

    if (!status) {
        return (
            <p className="text-muted-foreground text-sm">
                Peer-to-peer local sync is not configured for this device.
            </p>
        );
    }

    const triggerSyncNow = () => {
        mutate({
            input: {
                type: 'local.sync.trigger',
                userId: workspace.userId,
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

    const importSummary = formatSummary(status.lastImportSummary);
    const exportSummary = formatSummary(status.lastExportSummary);

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

            <div className="flex gap-2 pt-2">
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
            </div>
        </div>
    );
};
