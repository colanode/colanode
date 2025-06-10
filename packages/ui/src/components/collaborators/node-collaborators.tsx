import { Fragment } from 'react';

import { Node, NodeRole, extractNodeName, hasNodeRole } from '@colanode/core';
import { NodeCollaborator } from '@colanode/ui/components/collaborators/node-collaborator';
import { NodeCollaboratorCreate } from '@colanode/ui/components/collaborators/node-collaborator-create';
import { Separator } from '@colanode/ui/components/ui/separator';
import { buildNodeCollaborators } from '@colanode/ui/lib/nodes';

interface NodeCollaboratorsProps {
  node: Node;
  nodes: Node[];
  role: NodeRole;
}

export const NodeCollaborators = ({
  node,
  nodes,
  role,
}: NodeCollaboratorsProps) => {
  const collaborators = buildNodeCollaborators(nodes);
  const directCollaborators = collaborators.filter(
    (collaborator) => collaborator.nodeId === node.id
  );
  const directCollaboratorIds = directCollaborators.map(
    (collaborator) => collaborator.collaboratorId
  );

  const isAdmin = hasNodeRole(role, 'admin');
  const canAddCollaborator = isAdmin && node.type === 'space';
  const ancestors = nodes.filter((node) => node.id !== node.id);

  return (
    <div className="flex flex-col gap-2">
      {canAddCollaborator && (
        <Fragment>
          <NodeCollaboratorCreate
            nodeId={node.id}
            existingCollaborators={directCollaboratorIds}
          />
          <Separator />
        </Fragment>
      )}
      <div className="space-y-3">
        <h4 className="text-sm font-medium">Direct access</h4>
        <div className="flex flex-col gap-3">
          {directCollaborators.length > 0 ? (
            <Fragment>
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
                    nodeId={node.id}
                    collaboratorId={collaborator.collaboratorId}
                    role={collaborator.role}
                    canEdit={canEdit}
                    canRemove={canEdit}
                  />
                );
              })}
            </Fragment>
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
                      nodeId={node.id}
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
