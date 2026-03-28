import { FolderNodeView } from '@colanode/ui/editor/views';
import { createNodeExtension } from '@colanode/ui/editor/extensions/create-node-extension';

export const MobileFolderNode = createNodeExtension({
  name: 'folder',
  draggable: false,
  view: FolderNodeView,
});
