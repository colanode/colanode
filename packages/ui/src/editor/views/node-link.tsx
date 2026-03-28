import type { ReactNode } from 'react';

import { useApp } from '@colanode/ui/contexts/app';
import { Link } from '@colanode/ui/components/ui/link';
import { useNavigation } from '@colanode/ui/contexts/navigation';

interface NodeLinkProps {
  nodeId: string;
  nodeType: string;
  children: ReactNode;
}

export const NodeLink = ({ nodeId, nodeType, children }: NodeLinkProps) => {
  const app = useApp();
  const navigation = useNavigation();

  if (app.type === 'mobile') {
    return (
      <div
        role="link"
        className="outline-none"
        onClick={() => navigation.openNode(nodeId, nodeType)}
      >
        {children}
      </div>
    );
  }

  return (
    <Link from="/workspace/$userId" to="$nodeId" params={{ nodeId }}>
      {children}
    </Link>
  );
};
