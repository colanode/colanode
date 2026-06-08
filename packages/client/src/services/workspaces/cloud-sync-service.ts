
import { eventBus } from '@colanode/client/lib/event-bus';
import type { LocalSyncConfig } from '@colanode/client/services/app-meta';
import {
    createStorageProvider,
    StorageProvider,
} from '@colanode/client/services/backup';
import {
    migrateLegacyRootManifest,
    readWorkspaceManifest,
    writeWorkspaceManifest,
} from '@colanode/client/services/workspaces/workspace-manifest';
import { WorkspaceService } from '@colanode/client/services/workspaces/workspace-service';
import { DownloadStatus } from '@colanode/client/types/files';
import type {
    LocalSyncExportSummary,
    LocalSyncStatus,
} from '@colanode/client/types/workspaces';
import {
    createDebugger,
    generateId,
    IdType,
    SyncDocumentUpdateData,
    SyncNodeReactionData,
    SyncNodeTombstoneData,
    SyncNodeUpdateData,
} from '@colanode/core';
import { encodeState } from '@colanode/crdt';

const debug = createDebugger('desktop:service:cloud-sync');

// How often the device exchanges its op-log with the configured storage.
const SYNC_INTERVAL_MS = 10_000;

// Upper bound of rows pulled from each table per export cycle to keep individual
// log files small. The next cycle continues from the advanced cursor.
const EXPORT_BATCH_SIZE = 500;

type SyncRecord =
    | { kind: 'node.update'; data: SyncNodeUpdateData }
    | { kind: 'node.delete'; data: SyncNodeTombstoneData }
    | { kind: 'document.update'; data: SyncDocumentUpdateData }
    | { kind: 'node.reaction'; data: SyncNodeReactionData };

// Short human-readable label of where a device is shipping its op-log; surfaced
// in the workspace settings card so the user can confirm they connected the
// right bucket / folder.
const describeStorage = (config: LocalSyncConfig['storage']): string => {
    switch (config.type) {
        case 'local':
            return `local: ${config.path}`;
        case 's3': {
            const endpoint = config.endpoint ? ` @ ${config.endpoint}` : '';
            return `s3: ${config.bucket}${endpoint}`;
        }
        case 'github':
            return `github: ${config.owner}/${config.repo}`;
        default: {
            // Exhaustiveness guard: adding a new provider variant without
            // extending this switch will surface as a compile error here.
            const exhaustive: never = config;
            return (exhaustive as { type: string }).type;
        }
    }
};

// CloudSyncService implements peer-to-peer synchronization for local-only
// workspaces. Instead of syncing the SQLite database (which cannot be merged),
// it ships the CRDT op-log (node/document updates + tombstones) through an
// object storage bucket. Each device appends to its own immutable log prefix;
// other devices replay those logs into their local store via the workspace
// services' applyRemote* methods.
export class CloudSyncService {
    private readonly workspace: WorkspaceService;
    private readonly config: LocalSyncConfig;
    private readonly provider: StorageProvider;
    private readonly deviceId: string;

    private timer: NodeJS.Timeout | null = null;
    private running = false;
    private initialized = false;
    private status: LocalSyncStatus;

    constructor(workspace: WorkspaceService, config: LocalSyncConfig) {
        this.workspace = workspace;
        this.config = config;
        this.deviceId = config.deviceId;
        this.provider = createStorageProvider(config.storage);
        this.status = {
            enabled: true,
            deviceId: this.deviceId,
            storageDescription: describeStorage(config.storage),
            isRunning: false,
            paused: false,
            lastExportAt: null,
            lastExportError: null,
            lastExportSummary: null,
            lastImportAt: null,
            lastImportError: null,
            lastImportSummary: null,
            identityDrift: null,
        };
    }

    public getStatus(): LocalSyncStatus {
        return { ...this.status };
    }

    private updateStatus(patch: Partial<LocalSyncStatus>): void {
        this.status = { ...this.status, ...patch };
        eventBus.publish({
            type: 'local.sync.status.updated',
            workspace: {
                workspaceId: this.workspace.workspaceId,
                userId: this.workspace.userId,
                accountId: this.workspace.accountId,
            },
            status: { ...this.status },
        });
    }

    private get logPrefix(): string {
        return `workspaces/${this.workspace.workspaceId}/devices/`;
    }

    private get deviceLogPrefix(): string {
        return `${this.logPrefix}${this.deviceId}/`;
    }

    private fileKey(fileId: string, extension: string): string {
        return `workspaces/${this.workspace.workspaceId}/files/${fileId}${extension}`;
    }

    // Content-addressed file upload. Each fileId is a workspace-unique ULID so
    // the same key uniquely identifies the same bytes across devices.
    public async uploadFile(
        fileId: string,
        extension: string,
        data: Uint8Array | Buffer
    ): Promise<void> {
        if (!(await this.ensureInitialized())) {
            return;
        }
        const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
        await this.provider.upload(this.fileKey(fileId, extension), buf);
    }

    // Fetches the bytes for a previously uploaded file. Returns null if the
    // remote object is absent or the provider is unavailable.
    public async downloadFile(
        fileId: string,
        extension: string
    ): Promise<Uint8Array | null> {
        if (!(await this.ensureInitialized())) {
            return null;
        }
        const key = this.fileKey(fileId, extension);
        if (!(await this.provider.exists(key))) {
            return null;
        }
        try {
            const buf = await this.provider.download(key);
            return new Uint8Array(buf);
        } catch (error) {
            debug(`Failed to download file ${key}: ${error}`);
            return null;
        }
    }

    // Deletes a previously uploaded file blob from shared storage. Idempotent:
    // missing objects do not throw. Called both from the originating device's
    // local deletion path (file-service.deleteFile) and from importRemote as a
    // fallback when receiving a file tombstone, so any device that processes
    // the deletion contributes to garbage collection.
    public async deleteRemoteFile(
        fileId: string,
        extension: string
    ): Promise<void> {
        if (!(await this.ensureInitialized())) {
            return;
        }
        const key = this.fileKey(fileId, extension);
        try {
            await this.provider.delete(key);
        } catch (error) {
            debug(`Failed to delete remote file ${key}: ${error}`);
        }
    }

    // Lazily initializes the storage provider. Idempotent and safe to call from
    // any public entry point (init/sync/exportLocal/importRemote).
    private async ensureInitialized(): Promise<boolean> {
        if (!this.status.enabled) {
            return false;
        }
        if (this.initialized) {
            return true;
        }

        try {
            await this.provider.init();
        } catch (error) {
            debug(`Failed to initialize cloud sync provider: ${error}`);
            return false;
        }

        // One-shot migration: storage roots created by older single-workspace
        // builds keep manifest.json at the root. Move it under
        // workspaces/<wsId>/manifest.json so the root can host multiple
        // workspaces. Idempotent; cheap once migrated.
        try {
            const migrated = await migrateLegacyRootManifest(this.provider);
            if (migrated) {
                debug('Migrated legacy root manifest into per-workspace subtree');
            }
        } catch (error) {
            debug(`Legacy manifest migration failed (continuing): ${error}`);
        }

        // Verify the local workspace identity matches the shared manifest. If
        // the manifest is absent, claim authorship by writing our identity
        // (first-write-wins). If it disagrees with the local workspace, refuse
        // to sync to avoid corrupting the op-log under a foreign identity.
        try {
            const manifest = await readWorkspaceManifest(
                this.provider,
                this.workspace.workspaceId
            );
            if (!manifest) {
                await writeWorkspaceManifest(this.provider, {
                    workspaceId: this.workspace.workspaceId,
                    userId: this.workspace.userId,
                    name: this.workspace.workspace.name ?? this.workspace.workspaceId,
                    createdAt: new Date().toISOString(),
                    createdByDeviceId: this.deviceId,
                });
            } else if (
                manifest.workspaceId !== this.workspace.workspaceId ||
                manifest.userId !== this.workspace.userId
            ) {
                this.updateStatus({
                    enabled: false,
                    identityDrift: {
                        localWorkspaceId: this.workspace.workspaceId,
                        localUserId: this.workspace.userId,
                        manifestWorkspaceId: manifest.workspaceId,
                        manifestUserId: manifest.userId,
                        manifestCreatedByDeviceId: manifest.createdByDeviceId,
                    },
                    lastImportError:
                        'Local workspace identity does not match the shared manifest; sync disabled.',
                });
                debug(
                    `Identity drift detected: local ${this.workspace.workspaceId}/${this.workspace.userId} vs manifest ${manifest.workspaceId}/${manifest.userId}`
                );
                return false;
            }
        } catch (error) {
            debug(`Manifest check failed (continuing best-effort): ${error}`);
        }

        // If this device has never written to the current transport (e.g. the
        // user just pointed local-sync at a brand-new folder/bucket), reset
        // our export cursors so the next exportLocal() re-emits the full
        // op-log. Without this, the cursors in the local sqlite would claim
        // "already exported up to X" against the previous transport and the
        // new transport would end up with only the seed manifest.json.
        try {
            const existing = await this.provider.list(this.deviceLogPrefix);
            if (existing.length === 0) {
                await this.workspace.database
                    .deleteFrom('sync_state')
                    .where('key', 'like', 'export.%')
                    .execute();
            }
        } catch (error) {
            debug(`Export-cursor freshness check failed (continuing): ${error}`);
        }

        this.initialized = true;
        return true;
    }

    public async init(): Promise<void> {
        if (!(await this.ensureInitialized())) {
            return;
        }

        if (this.timer) {
            return;
        }

        // Kick off an immediate cycle, then schedule periodic syncs.
        void this.sync();

        this.timer = setInterval(() => {
            void this.sync();
        }, SYNC_INTERVAL_MS);
    }

    public destroy(): void {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.updateStatus({ enabled: false, isRunning: false });
    }

    // Manually triggers an immediate sync cycle from outside (UI button or
    // tests). Bypasses the paused flag so the user can always force a one-off
    // exchange even while periodic syncing is paused.
    public async triggerSyncNow(): Promise<void> {
        await this.sync(true);
    }

    // Pauses or resumes the periodic timer. While paused, sync() short-circuits
    // unless invoked with force=true (triggerSyncNow). Resuming kicks off an
    // immediate cycle so the user sees activity right away.
    public setPaused(paused: boolean): void {
        if (this.status.paused === paused) {
            return;
        }
        this.updateStatus({ paused });
        if (paused) {
            if (this.timer) {
                clearInterval(this.timer);
                this.timer = null;
            }
            return;
        }
        // Resuming: schedule again (if init succeeded) and run immediately.
        if (!this.timer && this.initialized) {
            this.timer = setInterval(() => {
                void this.sync();
            }, SYNC_INTERVAL_MS);
        }
        void this.sync();
    }

    // Runs one full sync cycle: pull remote logs first (so local state is fresh),
    // then push any new local changes. Overlapping cycles are skipped.
    public async sync(force = false): Promise<void> {
        if (!this.initialized || this.running) {
            return;
        }
        if (!force && this.status.paused) {
            return;
        }

        this.running = true;
        this.updateStatus({ isRunning: true });
        try {
            await this.importRemote();
            await this.exportLocal();
        } catch (error) {
            debug(`Cloud sync cycle failed: ${error}`);
        } finally {
            this.running = false;
            this.updateStatus({ isRunning: false });
        }
    }

    // ---- Export (local -> storage) ----

    public async exportLocal(): Promise<void> {
        if (!(await this.ensureInitialized())) {
            return;
        }

        const summary: LocalSyncExportSummary = {
            nodeUpdates: 0,
            documentUpdates: 0,
            reactions: 0,
            deletes: 0,
            files: 0,
        };
        try {
            const recordCounts = await this.exportRecords();
            summary.nodeUpdates = recordCounts.nodeUpdates;
            summary.documentUpdates = recordCounts.documentUpdates;
            summary.reactions = recordCounts.reactions;
            summary.deletes = recordCounts.deletes;
            summary.files = await this.exportFiles();
            this.updateStatus({
                lastExportAt: new Date().toISOString(),
                lastExportError: null,
                lastExportSummary: summary,
            });
        } catch (error) {
            this.updateStatus({
                lastExportAt: new Date().toISOString(),
                lastExportError: error instanceof Error ? error.message : String(error),
                lastExportSummary: summary,
            });
            throw error;
        }
    }

    private async exportRecords(): Promise<{
        nodeUpdates: number;
        documentUpdates: number;
        reactions: number;
        deletes: number;
    }> {
        const records: SyncRecord[] = [];

        const nodeUpdateCursor = await this.exportNodeUpdates(records);
        const documentUpdateCursor = await this.exportDocumentUpdates(records);
        const tombstoneCursor = await this.exportTombstones(records);
        const reactionCursor = await this.exportNodeReactions(records);

        if (records.length === 0) {
            return { nodeUpdates: 0, documentUpdates: 0, reactions: 0, deletes: 0 };
        }

        const seq = generateId(IdType.Update);
        const key = `${this.deviceLogPrefix}${seq}.jsonl`;
        const body = records.map((record) => JSON.stringify(record)).join('\n');

        await this.provider.upload(key, Buffer.from(body, 'utf8'));

        // Advance cursors only after the upload succeeds, so a failed upload is
        // retried on the next cycle.
        if (nodeUpdateCursor) {
            await this.setSyncState('export.node_updates', nodeUpdateCursor);
        }
        if (documentUpdateCursor) {
            await this.setSyncState('export.document_updates', documentUpdateCursor);
        }
        if (tombstoneCursor) {
            await this.setSyncState('export.tombstones', tombstoneCursor);
        }
        if (reactionCursor) {
            await this.setSyncState('export.node_reactions', reactionCursor);
        }

        debug(`Exported ${records.length} record(s) to ${key}`);

        let nodeUpdates = 0;
        let documentUpdates = 0;
        let reactions = 0;
        let deletes = 0;
        for (const record of records) {
            if (record.kind === 'node.update') nodeUpdates++;
            else if (record.kind === 'document.update') documentUpdates++;
            else if (record.kind === 'node.reaction') reactions++;
            else if (record.kind === 'node.delete') deletes++;
        }
        return { nodeUpdates, documentUpdates, reactions, deletes };
    }

    // Uploads locally-cached file bytes for any file nodes whose ULID is past
    // the last advanced cursor. Bytes are content-addressed at
    // workspaces/<wsId>/files/<fileId><ext>, so concurrent uploads from other
    // devices simply overwrite the same key with identical contents.
    private async exportFiles(): Promise<number> {
        const cursor = (await this.getSyncState('export.files')) ?? '';

        const rows = await this.workspace.database
            .selectFrom('local_files as lf')
            .innerJoin('nodes as n', 'n.id', 'lf.id')
            .select([
                'lf.id as id',
                'lf.path as path',
                'n.attributes as attributes',
            ])
            .where('n.type', '=', 'file')
            .where('lf.id', '>', cursor)
            .where('lf.download_status', '=', DownloadStatus.Completed)
            .orderBy('lf.id', 'asc')
            .limit(EXPORT_BATCH_SIZE)
            .execute();

        if (rows.length === 0) {
            return 0;
        }

        let lastUploadedId: string | null = null;
        let uploaded = 0;
        for (const row of rows) {
            let extension = '';
            try {
                const parsed = JSON.parse(row.attributes) as { extension?: string };
                extension = parsed?.extension ?? '';
            } catch {
                // Malformed attributes — best effort.
            }

            try {
                const data = await this.workspace.account.app.fs.readFile(row.path);
                await this.uploadFile(row.id, extension, data);
                lastUploadedId = row.id;
                uploaded++;
            } catch (error) {
                debug(`Failed to upload file ${row.id}: ${error}`);
                break;
            }
        }

        if (lastUploadedId) {
            await this.setSyncState('export.files', lastUploadedId);
            debug(`Uploaded ${uploaded} file(s) up to ${lastUploadedId}`);
        }
        return uploaded;
    }

    private async exportNodeUpdates(
        records: SyncRecord[]
    ): Promise<string | null> {
        const cursor = (await this.getSyncState('export.node_updates')) ?? '';

        // Only export updates whose node still exists locally; updates for deleted
        // nodes are superseded by the node's tombstone.
        const rows = await this.workspace.database
            .selectFrom('node_updates as u')
            .innerJoin('nodes as n', 'n.id', 'u.node_id')
            .select([
                'u.id as id',
                'u.node_id as nodeId',
                'u.data as data',
                'u.created_at as createdAt',
                'n.root_id as rootId',
                'n.created_by as createdBy',
            ])
            .where('u.id', '>', cursor)
            .orderBy('u.id', 'asc')
            .limit(EXPORT_BATCH_SIZE)
            .execute();

        if (rows.length === 0) {
            return null;
        }

        let lastId: string | null = null;
        for (const row of rows) {
            records.push({
                kind: 'node.update',
                data: {
                    id: row.id,
                    nodeId: row.nodeId,
                    rootId: row.rootId,
                    workspaceId: this.workspace.workspaceId,
                    revision: '0',
                    data: encodeState(row.data),
                    createdAt: row.createdAt,
                    createdBy: row.createdBy,
                    mergedUpdates: null,
                },
            });
            lastId = row.id;
        }

        return lastId;
    }

    private async exportDocumentUpdates(
        records: SyncRecord[]
    ): Promise<string | null> {
        const cursor = (await this.getSyncState('export.document_updates')) ?? '';

        const rows = await this.workspace.database
            .selectFrom('document_updates as u')
            .innerJoin('documents as d', 'd.id', 'u.document_id')
            .select([
                'u.id as id',
                'u.document_id as documentId',
                'u.data as data',
                'u.created_at as createdAt',
                'd.created_by as createdBy',
            ])
            .where('u.id', '>', cursor)
            .orderBy('u.id', 'asc')
            .limit(EXPORT_BATCH_SIZE)
            .execute();

        if (rows.length === 0) {
            return null;
        }

        let lastId: string | null = null;
        for (const row of rows) {
            records.push({
                kind: 'document.update',
                data: {
                    id: row.id,
                    documentId: row.documentId,
                    data: encodeState(row.data),
                    revision: '0',
                    createdBy: row.createdBy,
                    createdAt: row.createdAt,
                    mergedUpdates: null,
                },
            });
            lastId = row.id;
        }

        return lastId;
    }

    private async exportTombstones(
        records: SyncRecord[]
    ): Promise<string | null> {
        // Cursor is "<deleted_at>|<id>" so it is strictly monotonic and unique even
        // when multiple nodes are deleted in the same millisecond.
        const cursor = (await this.getSyncState('export.tombstones')) ?? '';

        const rows = await this.workspace.database
            .selectFrom('tombstones')
            .selectAll()
            .orderBy('deleted_at', 'asc')
            .orderBy('id', 'asc')
            .execute();

        let lastCursor: string | null = null;
        let count = 0;
        for (const row of rows) {
            const rowCursor = `${row.deleted_at}|${row.id}`;
            if (rowCursor <= cursor) {
                continue;
            }

            let rootId = row.id;
            let fileExtension: string | undefined;
            try {
                const parsed = JSON.parse(row.data) as {
                    root_id?: string;
                    type?: string;
                    attributes?: string | { extension?: string };
                };
                if (parsed && parsed.root_id) {
                    rootId = parsed.root_id;
                }
                if (parsed && parsed.type === 'file') {
                    // tombstones.data stores the full deleted node row, where
                    // attributes is the same JSON-encoded string that lives on
                    // the nodes table. Parse it lazily so non-file tombstones
                    // pay nothing.
                    const attrs =
                        typeof parsed.attributes === 'string'
                            ? (JSON.parse(parsed.attributes) as {
                                extension?: string;
                            })
                            : parsed.attributes;
                    if (attrs && typeof attrs.extension === 'string') {
                        fileExtension = attrs.extension;
                    }
                }
            } catch {
                // Older tombstone payloads may not be parseable; fall back to the id.
            }

            records.push({
                kind: 'node.delete',
                data: {
                    id: row.id,
                    rootId,
                    workspaceId: this.workspace.workspaceId,
                    deletedBy: this.workspace.userId,
                    deletedAt: row.deleted_at,
                    revision: '0',
                    fileExtension,
                },
            });

            lastCursor = rowCursor;
            count++;
            if (count >= EXPORT_BATCH_SIZE) {
                break;
            }
        }

        return lastCursor;
    }

    // Ships locally-authored reactions (creates and deletions) through the same
    // op-log. Each entry's id is a monotonic ULID so the cursor is total-order
    // and resilient to clock skew across devices.
    private async exportNodeReactions(
        records: SyncRecord[]
    ): Promise<string | null> {
        const cursor = (await this.getSyncState('export.node_reactions')) ?? '';

        const rows = await this.workspace.database
            .selectFrom('node_reaction_updates')
            .selectAll()
            .where('id', '>', cursor)
            .orderBy('id', 'asc')
            .limit(EXPORT_BATCH_SIZE)
            .execute();

        let lastId: string | null = null;
        for (const row of rows) {
            let data: SyncNodeReactionData | null = null;
            try {
                data = JSON.parse(row.data) as SyncNodeReactionData;
            } catch {
                // Skip malformed payloads but still advance the cursor so the bad
                // row does not block the rest of the queue.
                lastId = row.id;
                continue;
            }

            records.push({ kind: 'node.reaction', data });
            lastId = row.id;
        }

        return lastId;
    }

    // ---- Import (storage -> local) ----

    public async importRemote(): Promise<void> {
        if (!(await this.ensureInitialized())) {
            return;
        }

        try {
            const keys = await this.provider.list(this.logPrefix);

            const applied = await this.getAppliedKeys();

            const pending = keys
                .filter((key) => key.endsWith('.jsonl'))
                .filter((key) => !key.startsWith(this.deviceLogPrefix))
                .filter((key) => !applied.has(key))
                .sort();

            if (pending.length === 0) {
                this.updateStatus({
                    lastImportAt: new Date().toISOString(),
                    lastImportError: null,
                    lastImportSummary: {
                        nodeUpdates: 0,
                        documentUpdates: 0,
                        reactions: 0,
                        deletes: 0,
                    },
                });
                return;
            }

            const nodeUpdates: SyncNodeUpdateData[] = [];
            const documentUpdates: SyncDocumentUpdateData[] = [];
            const nodeDeletes: SyncNodeTombstoneData[] = [];
            const nodeReactions: SyncNodeReactionData[] = [];

            for (const key of pending) {
                try {
                    const buffer = await this.provider.download(key);
                    const lines = buffer
                        .toString('utf8')
                        .split('\n')
                        .filter((line) => line.trim().length > 0);

                    for (const line of lines) {
                        const record = JSON.parse(line) as SyncRecord;
                        if (record.kind === 'node.update') {
                            nodeUpdates.push(record.data);
                        } else if (record.kind === 'document.update') {
                            documentUpdates.push(record.data);
                        } else if (record.kind === 'node.delete') {
                            nodeDeletes.push(record.data);
                        } else if (record.kind === 'node.reaction') {
                            nodeReactions.push(record.data);
                        }
                    }
                } catch (error) {
                    debug(`Failed to download/parse remote log ${key}: ${error}`);
                    this.updateStatus({
                        lastImportAt: new Date().toISOString(),
                        lastImportError: `Failed to read ${key}: ${error instanceof Error ? error.message : String(error)}`,
                    });
                    return;
                }
            }

            // Apply in a dependency-friendly order: node updates (so nodes exist), then
            // document updates (which reference their node), reactions after the
            // target nodes exist, and deletions last.
            nodeUpdates.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
            documentUpdates.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
            nodeReactions.sort((a, b) =>
                a.revision < b.revision ? -1 : a.revision > b.revision ? 1 : 0
            );
            nodeDeletes.sort((a, b) =>
                a.deletedAt < b.deletedAt ? -1 : a.deletedAt > b.deletedAt ? 1 : 0
            );

            for (const data of nodeUpdates) {
                await this.workspace.nodes.applyRemoteNodeUpdate(data);
            }
            for (const data of documentUpdates) {
                await this.workspace.documents.applyRemoteDocumentUpdate(data);
            }
            for (const data of nodeReactions) {
                await this.workspace.nodeReactions.applyRemoteNodeReaction(data);
            }
            for (const data of nodeDeletes) {
                await this.workspace.nodes.applyRemoteNodeDelete(data);
                // Fallback GC for the corresponding file blob in shared storage.
                // applyRemoteNodeDelete already triggers files.deleteFile (which
                // calls deleteRemoteFile via the local path) when the receiving
                // device has the node row, but a device that never received the
                // original create won't take that path; this ensures the blob
                // is collected either way. Idempotent at the provider level.
                if (data.fileExtension) {
                    await this.deleteRemoteFile(data.id, data.fileExtension);
                }
            }

            // Mark every processed log file as applied so it is not replayed again.
            for (const key of pending) {
                await this.setSyncState(`applied.${key}`, '1');
            }

            this.updateStatus({
                lastImportAt: new Date().toISOString(),
                lastImportError: null,
                lastImportSummary: {
                    nodeUpdates: nodeUpdates.length,
                    documentUpdates: documentUpdates.length,
                    reactions: nodeReactions.length,
                    deletes: nodeDeletes.length,
                },
            });

            debug(
                `Imported ${nodeUpdates.length} node update(s), ` +
                `${documentUpdates.length} document update(s), ` +
                `${nodeReactions.length} reaction(s), ` +
                `${nodeDeletes.length} deletion(s) from ${pending.length} file(s)`
            );
        } catch (error) {
            this.updateStatus({
                lastImportAt: new Date().toISOString(),
                lastImportError: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }

    // ---- sync_state helpers ----

    private async getSyncState(key: string): Promise<string | null> {
        const row = await this.workspace.database
            .selectFrom('sync_state')
            .select('value')
            .where('key', '=', key)
            .executeTakeFirst();

        return row?.value ?? null;
    }

    private async setSyncState(key: string, value: string): Promise<void> {
        const now = new Date().toISOString();
        await this.workspace.database
            .insertInto('sync_state')
            .values({ key, value, created_at: now, updated_at: now })
            .onConflict((cb) =>
                cb.column('key').doUpdateSet({ value, updated_at: now })
            )
            .execute();
    }

    private async getAppliedKeys(): Promise<Set<string>> {
        const rows = await this.workspace.database
            .selectFrom('sync_state')
            .select('key')
            .where('key', 'like', 'applied.%')
            .execute();

        const applied = new Set<string>();
        for (const row of rows) {
            applied.add(row.key.slice('applied.'.length));
        }
        return applied;
    }

}
