import { Kysely, Transaction } from 'kysely';

import { WorkspaceDatabaseSchema } from '@colanode/client/databases/workspace';
import { mapNode } from '@colanode/client/lib/mappers';
import { LocalNode } from '@colanode/client/types/nodes';

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

  await database.deleteFrom('local_files').where('id', '=', nodeId).execute();
};
