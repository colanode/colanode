import { CreateCollaboration } from '@/data/schema';
import { CollaborationAttributes, NodeType, registry } from '@colanode/core';
import { YDoc } from '@colanode/crdt';

export const buildDefaultCollaboration = (
  userId: string,
  nodeId: string,
  type: NodeType,
  workspaceId: string
): CreateCollaboration => {
  const model = registry.getCollaborationModel(type);

  const attributes: CollaborationAttributes = {
    type,
  };

  const ydoc = new YDoc();
  ydoc.updateAttributes(model.schema, attributes);

  return {
    user_id: userId,
    node_id: nodeId,
    workspace_id: workspaceId,
    attributes: JSON.stringify(ydoc.getAttributes()),
    state: ydoc.getState(),
    created_at: new Date(),
  };
};
