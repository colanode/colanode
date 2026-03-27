import { useRouter } from 'expo-router';

import { LocalNode } from '@colanode/client/types/nodes';

type AppRouter = ReturnType<typeof useRouter>;

export const navigateToNodeByType = (
  router: AppRouter,
  nodeId: string,
  nodeType: LocalNode['type']
) => {
  switch (nodeType) {
    case 'channel':
      router.push({
        pathname: '/(app)/(spaces)/channel/[channelId]',
        params: { channelId: nodeId },
      });
      break;
    case 'page':
      router.push({
        pathname: '/(app)/(spaces)/page/[pageId]',
        params: { pageId: nodeId },
      });
      break;
    case 'folder':
      router.push({
        pathname: '/(app)/(spaces)/folder/[folderId]',
        params: { folderId: nodeId },
      });
      break;
    case 'file':
      router.push({
        pathname: '/(app)/(spaces)/file/[fileId]',
        params: { fileId: nodeId },
      });
      break;
    case 'database':
      router.push({
        pathname: '/(app)/(spaces)/database/[databaseId]',
        params: { databaseId: nodeId },
      });
      break;
    case 'record':
      router.push({
        pathname: '/(app)/(spaces)/record/[recordId]',
        params: { recordId: nodeId },
      });
      break;
  }
};

export const navigateToNode = (router: AppRouter, node: LocalNode) => {
  navigateToNodeByType(router, node.id, node.type);
};
