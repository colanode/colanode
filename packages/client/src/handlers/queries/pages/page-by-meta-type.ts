import { sql } from 'kysely';

import { SelectNode } from '@colanode/client/databases/workspace';
import { WorkspaceQueryHandlerBase } from '@colanode/client/handlers/queries/workspace-query-handler-base';
import { ChangeCheckResult, QueryHandler } from '@colanode/client/lib';
import { mapNode } from '@colanode/client/lib/mappers';
import { PageByMetaTypeQueryInput } from '@colanode/client/queries/pages/page-by-meta-type';
import { Event } from '@colanode/client/types/events';
import { LocalPageNode } from '@colanode/client/types/nodes';

export class PageByMetaTypeQueryHandler
  extends WorkspaceQueryHandlerBase
  implements QueryHandler<PageByMetaTypeQueryInput>
{
  public async handleQuery(
    input: PageByMetaTypeQueryInput
  ): Promise<LocalPageNode[]> {
    const rows =
      (input.searchQuery?.length ?? 0) > 0
        ? await this.searchPages(input)
        : await this.fetchPages(input);

    return rows.map((row) => mapNode(row) as LocalPageNode);
  }

  public async checkForChanges(
    event: Event,
    input: PageByMetaTypeQueryInput,
    _: LocalPageNode[]
  ): Promise<ChangeCheckResult<PageByMetaTypeQueryInput>> {
    if (
      event.type === 'workspace.deleted' &&
      event.workspace.userId === input.userId
    ) {
      return { hasChanges: true, result: [] };
    }

    if (
      (event.type === 'node.created' ||
        event.type === 'node.updated' ||
        event.type === 'node.deleted') &&
      event.workspace.userId === input.userId &&
      event.node.type === 'page' &&
      (event.type === 'node.deleted' ||
        event.node.metaTypeId === input.metaTypeId)
    ) {
      return {
        hasChanges: true,
        result: await this.handleQuery(input),
      };
    }

    return { hasChanges: false };
  }

  private async searchPages(
    input: PageByMetaTypeQueryInput
  ): Promise<SelectNode[]> {
    const workspace = this.getWorkspace(input.userId);
    const exclude = input.exclude ?? [];
    const searchQuery = input.searchQuery ?? '';

    const query = sql<SelectNode>`
      SELECT n.*
      FROM nodes n
      JOIN node_texts nt ON n.id = nt.id
      WHERE n.type = 'page'
        AND n.meta_type_id = ${input.metaTypeId}
        AND (
          nt.name LIKE ${'%' + searchQuery + '%'}
          OR nt.attributes LIKE ${'%' + searchQuery + '%'}
        )
        ${
          exclude.length > 0
            ? sql`AND n.id NOT IN (${sql.join(
                exclude.map((id) => sql`${id}`),
                sql`, `
              )})`
            : sql``
        }
    `.compile(workspace.database);

    const result = await workspace.database.executeQuery(query);
    return result.rows;
  }

  private async fetchPages(
    input: PageByMetaTypeQueryInput
  ): Promise<SelectNode[]> {
    const workspace = this.getWorkspace(input.userId);
    const exclude = input.exclude ?? [];

    let query = workspace.database
      .selectFrom('nodes')
      .where('type', '=', 'page')
      .where('meta_type_id', '=', input.metaTypeId)
      .selectAll();

    if (exclude.length > 0) {
      query = query.where('id', 'not in', exclude);
    }

    return query.execute();
  }
}
