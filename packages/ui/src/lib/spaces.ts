import { LocalNode, LocalSpaceNode } from '@colanode/client/types';
import { compareString, generateFractionalIndex } from '@colanode/core';

interface NodeFractionalIndex {
  id: string;
  defaultIndex: string;
  customIndex: string | null;
}

export const sortSpaceChildren = (
  space: LocalSpaceNode,
  children: LocalNode[]
) => {
  const sortedById = children.toSorted((a, b) => compareString(a.id, b.id));
  const indexes: Record<string, string> = {};
  const childrenSettings = space.attributes.children ?? {};
  let lastIndex: string | null = null;

  for (const child of sortedById) {
    lastIndex = generateFractionalIndex(lastIndex, null);
    const customIndex = childrenSettings[child.id]?.index;
    indexes[child.id] = customIndex ?? lastIndex;
  }

  return sortedById.sort((a, b) => {
    const aIndex = indexes[a.id];
    const bIndex = indexes[b.id];
    return compareString(aIndex, bIndex);
  });
};

export const generateSpaceChildIndex = (
  space: LocalSpaceNode,
  children: LocalNode[],
  childId: string,
  after: string | null
): string | null => {
  const child = children.find((c) => c.id === childId);
  if (!child) {
    return null;
  }

  const sortedById = children.toSorted((a, b) => compareString(a.id, b.id));
  const indexes: NodeFractionalIndex[] = [];
  const childrenSettings = space.attributes.children ?? {};
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
    newIndex = generateFractionalIndex(previousIndex, newPotentialDefaultIndex);
  }

  return newIndex;
};
