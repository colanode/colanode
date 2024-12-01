import {
  extractNodeName,
  hasAdminAccess,
  Node,
  NodeRole,
} from '@colanode/core';
import React from 'react';

import { NodeCollaborator } from '@/renderer/components/collaborators/node-collaborator';
import { NodeCollaboratorCreate } from '@/renderer/components/collaborators/node-collaborator-create';
import { Separator } from '@/renderer/components/ui/separator';
import { buildNodeCollaborators } from '@/shared/lib/nodes';

interface NodeCollaboratorsProps {
  nodeId: string;
  nodes: Node[];
  role: NodeRole;
}

export const NodeCollaborators = ({
  nodeId,
  nodes,
  role,
}: NodeCollaboratorsProps) => {
  const collaborators = buildNodeCollaborators(nodes);
  const directCollaborators = collaborators.filter(
    (collaborator) => collaborator.nodeId === nodeId
  );
  const directCollaboratorIds = directCollaborators.map(
    (collaborator) => collaborator.collaboratorId
  );

  const isAdmin = hasAdminAccess(role);
  const ancestors = nodes.filter((node) => node.id !== nodeId);

  return (
    <div className="flex flex-col gap-2">
      {isAdmin && (
        <React.Fragment>
          <NodeCollaboratorCreate
            nodeId={nodeId}
            existingCollaborators={directCollaboratorIds}
          />
          <Separator />
        </React.Fragment>
      )}
      <div className="space-y-3">
        <h4 className="text-sm font-medium">Direct access</h4>
        <div className="flex flex-col gap-3">
          {directCollaborators.length > 0 ? (
            <React.Fragment>
              {directCollaborators.map((collaborator) => {
                // you can edit only if you have admin access
                // and there is at least one more admin

                let canEdit = isAdmin;
                if (canEdit && collaborator.role === 'admin') {
                  const otherAdmins = collaborators.filter(
                    (c) =>
                      c.collaboratorId !== collaborator.collaboratorId &&
                      c.role === 'admin'
                  ).length;

                  canEdit = otherAdmins > 0;
                }

                return (
                  <NodeCollaborator
                    key={collaborator.collaboratorId}
                    nodeId={nodeId}
                    collaboratorId={collaborator.collaboratorId}
                    role={collaborator.role}
                    canEdit={canEdit}
                    canRemove={canEdit}
                  />
                );
              })}
            </React.Fragment>
          ) : (
            <span className="text-xs text-muted-foreground">
              No direct access.
            </span>
          )}
        </div>
      </div>
      {ancestors.map((node) => {
        const inheritCollaborators = collaborators.filter(
          (collaborator) => collaborator.nodeId === node.id
        );

        if (inheritCollaborators.length === 0) {
          return null;
        }

        const name = extractNodeName(node.attributes) ?? 'Unknown';
        return (
          <div key={node.id}>
            <Separator className="my-3" />
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Inherit from {name}</h4>
              <div className="flex flex-col gap-3">
                {inheritCollaborators.map((collaborator) => {
                  const canEdit = isAdmin && collaborator.role !== 'admin';

                  return (
                    <NodeCollaborator
                      key={collaborator.collaboratorId}
                      nodeId={nodeId}
                      collaboratorId={collaborator.collaboratorId}
                      role={collaborator.role}
                      canEdit={canEdit}
                      canRemove={false}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
