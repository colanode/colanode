import { useEffect } from 'react';

import { Node } from '@colanode/core';
import { useRadar } from '@colanode/ui/contexts/radar';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

export const useNodeRadar = (node: Node | null) => {
  const workspace = useWorkspace();
  const radar = useRadar();

  useEffect(() => {
    if (!node) {
      return;
    }

    radar.markNodeAsOpened(workspace.accountId, workspace.id, node.id);

    const interval = setInterval(() => {
      radar.markNodeAsOpened(workspace.accountId, workspace.id, node.id);
    }, 60000);

    return () => clearInterval(interval);
  }, [node?.id]);
};
