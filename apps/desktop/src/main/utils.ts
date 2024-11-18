import { app } from 'electron';
import {
  DeleteResult,
  InsertResult,
  Kysely,
  Transaction,
  UpdateResult,
} from 'kysely';
import path from 'path';
import {
  SelectChange,
  SelectNode,
  WorkspaceDatabaseSchema,
} from '@/main/data/workspace/schema';
import { LocalChange, Node, NodeTypes } from '@colanode/core';
import { Account } from '@/shared/types/accounts';
import {
  SelectAccount,
  SelectServer,
  SelectWorkspace,
} from './data/app/schema';
import { Workspace } from '@/shared/types/workspaces';
import { Server } from '@/shared/types/servers';

export const appPath = app.getPath('userData');

export const appDatabasePath = path.join(appPath, 'app.db');

export const getWorkspaceDirectoryPath = (userId: string): string => {
  return path.join(appPath, 'workspaces', userId);
};

export const getWorkspaceFilesDirectoryPath = (userId: string): string => {
  return path.join(getWorkspaceDirectoryPath(userId), 'files');
};

export const getAccountAvatarsDirectoryPath = (accountId: string): string => {
  return path.join(appPath, 'avatars', accountId);
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

export const fetchNodeAncestors = (
  database:
    | Kysely<WorkspaceDatabaseSchema>
    | Transaction<WorkspaceDatabaseSchema>,
  nodeId: string
): Promise<SelectNode[]> => {
  return database
    .selectFrom('nodes')
    .selectAll()
    .where(
      'id',
      'in',
      database
        .selectFrom('node_paths')
        .select('ancestor_id')
        .where('descendant_id', '=', nodeId)
    )
    .where('type', '!=', NodeTypes.Workspace)
    .execute();
};

export const mapNode = (row: SelectNode): Node => {
  return {
    id: row.id,
    type: row.type as any,
    index: row.index,
    parentId: row.parent_id,
    attributes: JSON.parse(row.attributes),
    createdAt: row.created_at,
    createdBy: row.created_by,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
    versionId: row.version_id,
    serverCreatedAt: row.server_created_at,
    serverUpdatedAt: row.server_updated_at,
    serverVersionId: row.server_version_id,
  };
};

export const mapAccount = (row: SelectAccount): Account => {
  return {
    id: row.id,
    server: row.server,
    name: row.name,
    avatar: row.avatar,
    deviceId: row.device_id,
    email: row.email,
    token: row.token,
    status: row.status,
  };
};

export const mapWorkspace = (row: SelectWorkspace): Workspace => {
  return {
    id: row.workspace_id,
    name: row.name,
    versionId: row.version_id,
    accountId: row.account_id,
    role: row.role,
    userId: row.user_id,
    avatar: row.avatar,
    description: row.description,
  };
};

export const mapChange = (row: SelectChange): LocalChange => {
  return {
    id: row.id,
    data: JSON.parse(row.data),
    createdAt: row.created_at,
    retryCount: row.retry_count,
  };
};

export const mapServer = (row: SelectServer): Server => {
  return {
    domain: row.domain,
    name: row.name,
    avatar: row.avatar,
    attributes: JSON.parse(row.attributes),
    version: row.version,
    createdAt: new Date(row.created_at),
    lastSyncedAt: row.last_synced_at ? new Date(row.last_synced_at) : null,
  };
};
