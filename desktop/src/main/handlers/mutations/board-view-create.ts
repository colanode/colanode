import { databaseManager } from '@/main/data/database-manager';
import { NodeTypes, ViewNodeTypes } from '@/lib/constants';
import { generateId, IdType } from '@/lib/id';
import { buildCreateNode, generateNodeIndex } from '@/lib/nodes';
import { compareString } from '@/lib/utils';
import { MutationHandler, MutationResult } from '@/operations/mutations';
import { BoardViewCreateMutationInput } from '@/operations/mutations/board-view-create';

export class BoardViewCreateMutationHandler
  implements MutationHandler<BoardViewCreateMutationInput>
{
  async handleMutation(
    input: BoardViewCreateMutationInput,
  ): Promise<MutationResult<BoardViewCreateMutationInput>> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId,
    );

    const siblings = await workspaceDatabase
      .selectFrom('nodes')
      .where((eb) =>
        eb.and([
          eb('parent_id', '=', input.databaseId),
          eb('type', 'in', ViewNodeTypes),
        ]),
      )
      .selectAll()
      .execute();

    const maxIndex =
      siblings.length > 0
        ? siblings.sort((a, b) => compareString(a.index, b.index))[
            siblings.length - 1
          ].index
        : null;

    const id = generateId(IdType.BoardView);
    await workspaceDatabase
      .insertInto('nodes')
      .values(
        buildCreateNode(
          {
            id: id,
            attributes: {
              type: NodeTypes.BoardView,
              parentId: input.databaseId,
              index: generateNodeIndex(maxIndex, null),
            },
          },
          input.userId,
        ),
      )
      .execute();

    return {
      output: {
        id: id,
      },
      changes: [
        {
          type: 'workspace',
          table: 'nodes',
          userId: input.userId,
        },
      ],
    };
  }
}