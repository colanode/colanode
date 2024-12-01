import { Node, NodeRole } from '@colanode/core';
import { UserRoundPlus } from 'lucide-react';

import { NodeCollaborators } from '@/renderer/components/collaborators/node-collaborators';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/renderer/components/ui/popover';

interface NodeCollaboratorsPopoverProps {
  nodeId: string;
  nodes: Node[];
  role: NodeRole;
}

export const NodeCollaboratorsPopover = ({
  nodeId,
  nodes,
  role,
}: NodeCollaboratorsPopoverProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <UserRoundPlus className="size-5 cursor-pointer text-muted-foreground hover:text-foreground" />
      </PopoverTrigger>
      <PopoverContent className="mr-2 max-h-128 w-128 overflow-auto">
        <NodeCollaborators nodeId={nodeId} nodes={nodes} role={role} />
      </PopoverContent>
    </Popover>
  );
};
