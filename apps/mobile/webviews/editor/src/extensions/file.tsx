import { createNodeExtension } from '@colanode/ui/editor/extensions/create-node-extension';

import { MobileFileNodeView } from '../views/file';

export const MobileFileNode = createNodeExtension({
  name: 'file',
  draggable: false,
  view: MobileFileNodeView,
});
