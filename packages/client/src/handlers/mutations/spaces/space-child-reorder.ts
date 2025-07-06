import { SelectNode } from '@colanode/client/databases';
import { WorkspaceMutationHandlerBase } from '@colanode/client/handlers/mutations/workspace-mutation-handler-base';
import { MutationHandler } from '@colanode/client/lib/types';
import {
  MutationError,
  MutationErrorCode,
  SpaceChildReorderMutationInput,
  SpaceChildReorderMutationOutput,
} from '@colanode/client/mutations';
import {
  compareString,
  generateFractionalIndex,
  SpaceAttributes,
} from '@colanode/core';

interface NodeFractionalIndex {
  id: string;
  defaultIndex: string;
  customIndex: string | null;
}

export class SpaceChildReorderMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<SpaceChildReorderMutationInput>
{
  async handleMutation(
    input: SpaceChildReorderMutationInput
  ): Promise<SpaceChildReorderMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);
    const children = await workspace.database
      .selectFrom('nodes')
      .where('parent_id', '=', input.spaceId)
      .orderBy('id')
      .selectAll()
      .execute();

    if (children.length === 0) {
      throw new MutationError(
        MutationErrorCode.SpaceUpdateFailed,
        'Space has no children.'
      );
    }

    const result = await workspace.nodes.updateNode<SpaceAttributes>(
      input.spaceId,
      (attributes) => {
        const newIndex = this.generateSpaceChildIndex(
          attributes,
          children,
          input.childId,
          input.after
        );

        if (!newIndex) {
          throw new MutationError(
            MutationErrorCode.SpaceUpdateFailed,
            'Failed to generate new index.'
          );
        }

        const childrenSettings = attributes.children ?? {};
        childrenSettings[input.childId] = {
          ...(childrenSettings[input.childId] ?? {}),
          id: input.childId,
          index: newIndex,
        };

        attributes.children = childrenSettings;
        return attributes;
      }
    );

    if (result === 'unauthorized') {
      throw new MutationError(
        MutationErrorCode.SpaceUpdateForbidden,
        "You don't have permission to update this space."
      );
    }

    return {
      success: true,
    };
  }

  private generateSpaceChildIndex(
    attributes: SpaceAttributes,
    children: SelectNode[],
    childId: string,
    after: string | null
  ): string | null {
    const child = children.find((c) => c.id === childId);
    if (!child) {
      return null;
    }

    const sortedById = children.toSorted((a, b) => compareString(a.id, b.id));
    const indexes: NodeFractionalIndex[] = [];
    const childrenSettings = attributes.children ?? {};
    let lastIndex: string | null = null;

    for (const child of sortedById) {
      lastIndex = generateFractionalIndex(lastIndex, null);
      indexes.push({
        id: child.id,
        defaultIndex: lastIndex,
        customIndex: childrenSettings[child.id]?.index ?? null,
      });
    }

    const sortedIndexes = indexes.sort((a, b) =>
      compareString(
        a.customIndex ?? a.defaultIndex,
        b.customIndex ?? b.defaultIndex
      )
    );

    if (after === null) {
      const firstIndex = sortedIndexes[0];
      if (!firstIndex) {
        return generateFractionalIndex(null, null);
      }

      const nextIndex = firstIndex.customIndex ?? firstIndex.defaultIndex;
      return generateFractionalIndex(null, nextIndex);
    }

    const afterNodeIndex = sortedIndexes.findIndex((node) => node.id === after);
    if (afterNodeIndex === -1) {
      return null;
    }

    const afterNode = sortedIndexes[afterNodeIndex];
    if (!afterNode) {
      return null;
    }

    const previousIndex = afterNode.customIndex ?? afterNode.defaultIndex;
    let nextIndex: string | null = null;
    if (afterNodeIndex < sortedIndexes.length - 1) {
      const nextNode = sortedIndexes[afterNodeIndex + 1];
      if (!nextNode) {
        return null;
      }

      nextIndex = nextNode.customIndex ?? nextNode.defaultIndex;
    }

    let newIndex = generateFractionalIndex(previousIndex, nextIndex);

    const maxDefaultIndex = sortedIndexes
      .map((index) => index.defaultIndex)
      .sort((a, b) => -compareString(a, b))[0]!;

    const newPotentialDefaultIndex = generateFractionalIndex(
      maxDefaultIndex,
      null
    );

    if (newPotentialDefaultIndex === newIndex) {
      newIndex = generateFractionalIndex(
        previousIndex,
        newPotentialDefaultIndex
      );
    }

    return newIndex;
  }
}
