import { createNodeExtension } from '@colanode/ui/editor/extensions/create-node-extension';

import { MobileDatabaseNodeView } from '../views/database';

export const MobileDatabaseNode = createNodeExtension({
  name: 'database',
  draggable: false,
  view: MobileDatabaseNodeView,
  attributes: {
    id: { default: null },
    inline: { default: false },
  },
});
