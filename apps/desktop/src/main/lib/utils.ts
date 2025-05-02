import { extractFileSubtype } from '@colanode/core';
import {
  DeleteResult,
  InsertResult,
  Kysely,
  sql,
  Transaction,
  UpdateResult,
} from 'kysely';
import mime from 'mime-types';

import { app } from 'electron';
import path from 'path';
import fs from 'fs';

import { WorkspaceDatabaseSchema } from '@/main/databases/workspace';
import { FileMetadata } from '@/shared/types/files';
import { LocalNode } from '@/shared/types/nodes';
import { mapNode } from '@/main/lib/mappers';

export const appPath = app.getPath('userData');

export const appDatabasePath = path.join(appPath, 'app.db');

export const accountsDirectoryPath = path.join(appPath, 'accounts');

export const getAccountDirectoryPath = (accountId: string): string => {
  return path.join(accountsDirectoryPath, accountId);
};

export const getWorkspaceDirectoryPath = (
  accountId: string,
  workspaceId: string
): string => {
  return path.join(
    getAccountDirectoryPath(accountId),
    'workspaces',
    workspaceId
  );
};

export const getWorkspaceFilesDirectoryPath = (
  accountId: string,
  workspaceId: string
): string => {
  return path.join(getWorkspaceDirectoryPath(accountId, workspaceId), 'files');
};

export const getWorkspaceTempFilesDirectoryPath = (
  accountId: string,
  workspaceId: string
): string => {
  return path.join(getWorkspaceDirectoryPath(accountId, workspaceId), 'temp');
};

export const getAccountAvatarsDirectoryPath = (accountId: string): string => {
  return path.join(getAccountDirectoryPath(accountId), 'avatars');
};

export const getAssetsSourcePath = (): string => {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'assets');
  }

  return path.resolve(__dirname, '../../assets');
};

export const getAppIconPath = (): string => {
  return path.join(getAssetsSourcePath(), 'colanode-logo-black.png');
};

export const hasInsertChanges = (result: InsertResult[]): boolean => {
  if (result.length === 0) {
    return false;
  }

  return result.some(
    (r) => r.numInsertedOrUpdatedRows && r.numInsertedOrUpdatedRows > 0n
  );
};

export const hasUpdateChanges = (result: UpdateResult[]): boolean => {
  if (result.length === 0) {
    return false;
  }

  return result.some((r) => r.numUpdatedRows && r.numUpdatedRows > 0n);
};

export const hasDeleteChanges = (result: DeleteResult[]): boolean => {
  return result.some((r) => r.numDeletedRows && r.numDeletedRows > 0n);
};

export const getFileMetadata = (filePath: string): FileMetadata | null => {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const mimeType = mime.lookup(filePath);
  if (mimeType === false) {
    return null;
  }

  const stats = fs.statSync(filePath);
  const type = extractFileSubtype(mimeType);

  return {
    path: filePath,
    mimeType,
    extension: path.extname(filePath),
    name: path.basename(filePath),
    size: stats.size,
    type,
  };
};

export const fetchNodeTree = async (
  database:
    | Kysely<WorkspaceDatabaseSchema>
    | Transaction<WorkspaceDatabaseSchema>,
  nodeId: string
): Promise<LocalNode[]> => {
  const nodes = await database
    .withRecursive('ancestor_nodes', (cte) =>
      cte
        .selectFrom('nodes')
        .selectAll('nodes')
        .where('id', '=', nodeId)
        .unionAll(
          cte
            .selectFrom('nodes as parent')
            .selectAll('parent')
            .innerJoin(
              'ancestor_nodes as child',
              'parent.id',
              'child.parent_id'
            )
        )
    )
    .selectFrom('ancestor_nodes')
    .selectAll()
    .execute();

  return nodes.reverse().map(mapNode);
};

export const fetchNode = async (
  database:
    | Kysely<WorkspaceDatabaseSchema>
    | Transaction<WorkspaceDatabaseSchema>,
  nodeId: string
): Promise<LocalNode | undefined> => {
  const node = await database
    .selectFrom('nodes')
    .selectAll()
    .where('id', '=', nodeId)
    .executeTakeFirst();

  return node ? mapNode(node) : undefined;
};

export const fetchUserStorageUsed = async (
  database:
    | Kysely<WorkspaceDatabaseSchema>
    | Transaction<WorkspaceDatabaseSchema>,
  userId: string
): Promise<bigint> => {
  const storageUsedRow = await database
    .selectFrom('nodes')
    .select(({ fn }) => [
      fn.sum(sql`json_extract(attributes, '$.size')`).as('storage_used'),
    ])
    .where('type', '=', 'file')
    .where('created_by', '=', userId)
    .executeTakeFirst();

  return BigInt(storageUsedRow?.storage_used ?? 0);
};

export const deleteNodeRelations = async (
  database:
    | Kysely<WorkspaceDatabaseSchema>
    | Transaction<WorkspaceDatabaseSchema>,
  nodeId: string
) => {
  await database.deleteFrom('node_states').where('id', '=', nodeId).execute();

  await database
    .deleteFrom('node_updates')
    .where('node_id', '=', nodeId)
    .execute();

  await database
    .deleteFrom('node_interactions')
    .where('node_id', '=', nodeId)
    .execute();

  await database
    .deleteFrom('node_reactions')
    .where('node_id', '=', nodeId)
    .execute();

  await database.deleteFrom('node_texts').where('id', '=', nodeId).execute();

  await database
    .deleteFrom('documents')
    .where('id', '=', nodeId)
    .executeTakeFirst();

  await database
    .deleteFrom('document_states')
    .where('id', '=', nodeId)
    .execute();

  await database
    .deleteFrom('document_updates')
    .where('document_id', '=', nodeId)
    .execute();

  await database.deleteFrom('tombstones').where('id', '=', nodeId).execute();

  await database
    .deleteFrom('node_references')
    .where('node_id', '=', nodeId)
    .execute();

  await database
    .deleteFrom('node_counters')
    .where('node_id', '=', nodeId)
    .execute();

  await database.deleteFrom('file_states').where('id', '=', nodeId).execute();
};
