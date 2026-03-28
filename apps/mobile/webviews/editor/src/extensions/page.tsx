import { PageNodeView } from '@colanode/ui/editor/views';
import { createNodeExtension } from '@colanode/ui/editor/extensions/create-node-extension';

export const MobilePageNode = createNodeExtension({
  name: 'page',
  draggable: false,
  view: PageNodeView,
});
