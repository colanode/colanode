import { sql } from 'kysely';

import { WorkspaceQueryHandlerBase } from '@colanode/client/handlers/queries/workspace-query-handler-base';
import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib';
import {
  UserStorageGetQueryInput,
  UserStorageGetQueryOutput,
} from '@colanode/client/queries/users/user-storage-get';
import { Event } from '@colanode/client/types/events';
import { FileStatus, FileSubtype } from '@colanode/core';

interface UserStorageAggregateRow {
  subtype: string;
  total_size: string;
}

export class UserStorageGetQueryHandler
  extends WorkspaceQueryHandlerBase
  implements QueryHandler<UserStorageGetQueryInput>
{
  public async handleQuery(
    input: UserStorageGetQueryInput
  ): Promise<UserStorageGetQueryOutput> {
    const result = await this.fetchStorage(input);
    return result;
  }

  public async checkForChanges(
    event: Event,
    input: UserStorageGetQueryInput,
    _: UserStorageGetQueryOutput
  ): Promise<ChangeCheckResult<UserStorageGetQueryInput>> {
    if (
      event.type === 'workspace.deleted' &&
      event.workspace.accountId === input.accountId &&
      event.workspace.id === input.workspaceId
    ) {
      return {
        hasChanges: true,
        result: {
          storageLimit: '0',
          storageUsed: '0',
          subtypes: [],
        },
      };
    }

    if (
      event.type === 'node.created' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.node.type === 'file' &&
      event.node.attributes.status === FileStatus.Ready
    ) {
      const output = await this.handleQuery(input);
      return {
        hasChanges: true,
        result: output,
      };
    }

    if (
      event.type === 'node.updated' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.node.type === 'file' &&
      event.node.attributes.status === FileStatus.Ready
    ) {
      const output = await this.handleQuery(input);
      return {
        hasChanges: true,
        result: output,
      };
    }

    if (
      event.type === 'node.deleted' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.node.type === 'file' &&
      event.node.attributes.status === FileStatus.Ready
    ) {
      const output = await this.handleQuery(input);
      return {
        hasChanges: true,
        result: output,
      };
    }

    return {
      hasChanges: false,
    };
  }

  private async fetchStorage(
    input: UserStorageGetQueryInput
  ): Promise<UserStorageGetQueryOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const result = await sql<UserStorageAggregateRow>`
      SELECT 
        json_extract(attributes, '$.subtype') as subtype,
        SUM(COALESCE(CAST(json_extract(attributes, '$.size') as INTEGER), 0)) as total_size
      FROM nodes
      WHERE type = 'file' 
        AND created_by = ${workspace.userId} 
        AND json_extract(attributes, '$.status') = ${FileStatus.Ready}
      GROUP BY json_extract(attributes, '$.subtype')
      ORDER BY total_size DESC
    `.execute(workspace.database);

    const subtypes: {
      subtype: FileSubtype;
      storageUsed: string;
    }[] = [];
    let totalUsed = 0n;

    for (const row of result.rows) {
      const subtype = (row.subtype as FileSubtype) ?? 'other';
      const sizeString = row.total_size || '0';
      subtypes.push({
        subtype,
        storageUsed: sizeString,
      });
      totalUsed += BigInt(sizeString);
    }

    return {
      storageLimit: workspace.storageLimit,
      storageUsed: totalUsed.toString(),
      subtypes,
    };
  }
}
