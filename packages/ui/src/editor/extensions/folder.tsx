import { FolderNodeView } from '@colanode/ui/editor/views';
import { createNodeExtension } from '@colanode/ui/editor/extensions/create-node-extension';

export const FolderNode = createNodeExtension({
  name: 'folder',
  draggable: true,
  view: FolderNodeView,
});
