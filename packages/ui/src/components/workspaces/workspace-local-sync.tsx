import { LocalSyncStatus } from '@colanode/client/types';
import { Badge } from '@colanode/ui/components/ui/badge';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
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

const renderBadge = (status: LocalSyncStatus) => {
    if (!status.enabled) {
        return <Badge variant="outline">Disabled</Badge>;
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

    const status = statusQuery.data ?? null;

    if (!status) {
        return (
            <p className="text-muted-foreground text-sm">
                Peer-to-peer local sync is not configured for this device.
            </p>
        );
    }

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

                <dt className="text-muted-foreground">Last export</dt>
                <dd>{formatTimestamp(status.lastExportAt)}</dd>

                {status.lastExportError ? (
                    <>
                        <dt className="text-muted-foreground">Export error</dt>
                        <dd className="text-destructive break-words">
                            {status.lastExportError}
                        </dd>
                    </>
                ) : null}

                <dt className="text-muted-foreground">Last import</dt>
                <dd>{formatTimestamp(status.lastImportAt)}</dd>

                {status.lastImportError ? (
                    <>
                        <dt className="text-muted-foreground">Import error</dt>
                        <dd className="text-destructive break-words">
                            {status.lastImportError}
                        </dd>
                    </>
                ) : null}
            </dl>
        </div>
    );
};
