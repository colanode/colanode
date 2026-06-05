
import type { LocalSyncConfig } from '@colanode/client/services/app-meta';
import {
    createStorageProvider,
    StorageProvider,
} from '@colanode/client/services/backup';
import { WorkspaceService } from '@colanode/client/services/workspaces/workspace-service';
import {
    createDebugger,
    generateId,
    IdType,
    SyncDocumentUpdateData,
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
    | { kind: 'document.update'; data: SyncDocumentUpdateData };

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

    constructor(workspace: WorkspaceService, config: LocalSyncConfig) {
        this.workspace = workspace;
        this.config = config;
        this.deviceId = config.deviceId;
        this.provider = createStorageProvider(config.storage);
    }

    private get logPrefix(): string {
        return `workspaces/${this.workspace.workspaceId}/devices/`;
    }

    private get deviceLogPrefix(): string {
        return `${this.logPrefix}${this.deviceId}/`;
    }

    // Lazily initializes the storage provider. Idempotent and safe to call from
    // any public entry point (init/sync/exportLocal/importRemote).
    private async ensureInitialized(): Promise<boolean> {
        if (this.initialized) {
            return true;
        }

        try {
            await this.provider.init();
            this.initialized = true;
            return true;
        } catch (error) {
            debug(`Failed to initialize cloud sync provider: ${error}`);
            return false;
        }
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
    }

    // Runs one full sync cycle: pull remote logs first (so local state is fresh),
    // then push any new local changes. Overlapping cycles are skipped.
    public async sync(): Promise<void> {
        if (!this.initialized || this.running) {
            return;
        }

        this.running = true;
        try {
            await this.importRemote();
            await this.exportLocal();
        } catch (error) {
            debug(`Cloud sync cycle failed: ${error}`);
        } finally {
            this.running = false;
        }
    }

    // ---- Export (local -> storage) ----

    public async exportLocal(): Promise<void> {
        if (!(await this.ensureInitialized())) {
            return;
        }

        const records: SyncRecord[] = [];

        const nodeUpdateCursor = await this.exportNodeUpdates(records);
        const documentUpdateCursor = await this.exportDocumentUpdates(records);
        const tombstoneCursor = await this.exportTombstones(records);

        if (records.length === 0) {
            return;
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

        debug(`Exported ${records.length} record(s) to ${key}`);
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
            try {
                const parsed = JSON.parse(row.data) as { root_id?: string };
                if (parsed && parsed.root_id) {
                    rootId = parsed.root_id;
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

    // ---- Import (storage -> local) ----

    public async importRemote(): Promise<void> {
        if (!(await this.ensureInitialized())) {
            return;
        }

        const keys = await this.provider.list(this.logPrefix);

        const applied = await this.getAppliedKeys();

        const pending = keys
            .filter((key) => key.endsWith('.jsonl'))
            .filter((key) => !key.startsWith(this.deviceLogPrefix))
            .filter((key) => !applied.has(key))
            .sort();

        if (pending.length === 0) {
            return;
        }

        const nodeUpdates: SyncNodeUpdateData[] = [];
        const documentUpdates: SyncDocumentUpdateData[] = [];
        const nodeDeletes: SyncNodeTombstoneData[] = [];

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
                    }
                }
            } catch (error) {
                debug(`Failed to download/parse remote log ${key}: ${error}`);
                return;
            }
        }

        // Apply in a dependency-friendly order: node updates (so nodes exist), then
        // document updates (which reference their node), then deletions last.
        nodeUpdates.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
        documentUpdates.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
        nodeDeletes.sort((a, b) =>
            a.deletedAt < b.deletedAt ? -1 : a.deletedAt > b.deletedAt ? 1 : 0
        );

        for (const data of nodeUpdates) {
            await this.workspace.nodes.applyRemoteNodeUpdate(data);
        }
        for (const data of documentUpdates) {
            await this.workspace.documents.applyRemoteDocumentUpdate(data);
        }
        for (const data of nodeDeletes) {
            await this.workspace.nodes.applyRemoteNodeDelete(data);
        }

        // Mark every processed log file as applied so it is not replayed again.
        for (const key of pending) {
            await this.setSyncState(`applied.${key}`, '1');
        }

        debug(
            `Imported ${nodeUpdates.length} node update(s), ` +
            `${documentUpdates.length} document update(s), ` +
            `${nodeDeletes.length} deletion(s) from ${pending.length} file(s)`
        );
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
