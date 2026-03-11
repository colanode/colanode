import { useRouter } from 'expo-router';

import { LocalNode } from '@colanode/client/types/nodes';

type AppRouter = ReturnType<typeof useRouter>;

export const navigateToNode = (router: AppRouter, node: LocalNode) => {
  switch (node.type) {
    case 'channel':
      router.push({
        pathname: '/(app)/(spaces)/channel/[channelId]',
        params: { channelId: node.id },
      });
      break;
    case 'page':
      router.push({
        pathname: '/(app)/(spaces)/page/[pageId]',
        params: { pageId: node.id },
      });
      break;
    case 'folder':
      router.push({
        pathname: '/(app)/(spaces)/folder/[folderId]',
        params: { folderId: node.id },
      });
      break;
    case 'file':
      router.push({
        pathname: '/(app)/(spaces)/file/[fileId]',
        params: { fileId: node.id },
      });
      break;
  }
};
