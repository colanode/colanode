import { mapContentsToEditorNodes } from '@/renderer/editor/mappers';
import { databaseManager } from '@/main/data/database-manager';
import { NodeTypes } from '@/lib/constants';
import { NeuronId } from '@/lib/id';
import { buildCreateNode } from '@/lib/nodes';
import { MutationHandler, MutationResult } from '@/types/mutations';
import { MessageCreateMutationInput } from '@/types/mutations/message-create';
import { LocalNode } from '@/types/nodes';
import { CreateNode } from '@/main/data/workspace/schema';

export class MessageCreateMutationHandler
  implements MutationHandler<MessageCreateMutationInput>
{
  async handleMutation(
    input: MessageCreateMutationInput,
  ): Promise<MutationResult<MessageCreateMutationInput>> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId,
    );

    const id = NeuronId.generate(NeuronId.Type.Message);
    const editorNodes = mapContentsToEditorNodes(
      input.content.content,
      id,
      new Map<string, LocalNode>(),
    );

    const nodesToCreate: CreateNode[] = [
      buildCreateNode(
        {
          id: id,
          attributes: {
            type: NodeTypes.Message,
            parentId: input.conversationId,
          },
        },
        input.userId,
      ),
    ];

    for (const editorNode of editorNodes) {
      nodesToCreate.push(
        buildCreateNode(
          {
            id: editorNode.id,
            attributes: editorNode.attributes,
          },
          input.userId,
        ),
      );
    }

    await workspaceDatabase.insertInto('nodes').values(nodesToCreate).execute();

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