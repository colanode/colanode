import { PageNodeView } from '@colanode/ui/editor/views';
import { createNodeExtension } from '@colanode/ui/editor/extensions/create-node-extension';

const PageNode = createNodeExtension({
  name: 'page',
  draggable: true,
  view: PageNodeView,
});

export { PageNode };
