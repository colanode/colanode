import type { LocalDatabaseNode } from '@colanode/client/types';
import { DatabaseNotFound } from '@colanode/ui/components/databases/database-not-found';
import { Database } from '@colanode/ui/components/databases/database';
import { DatabaseViews } from '@colanode/ui/components/databases/database-views';
import { MobileLayout } from '@colanode/ui/components/databases/mobile-layout';
import { NodeProvider } from '@colanode/ui/components/nodes/node-provider';
import { useNode } from '@colanode/ui/contexts/node';

interface MobileDatabaseRuntimeProps {
  databaseId: string;
  inline?: boolean;
}

export const MobileDatabaseRuntime = ({
  databaseId,
  inline = false,
}: MobileDatabaseRuntimeProps) => {
  return (
    <NodeProvider nodeId={databaseId}>
      <MobileDatabaseRuntimeContent inline={inline} />
    </NodeProvider>
  );
};

const MobileDatabaseRuntimeContent = ({ inline }: { inline: boolean }) => {
  const { node, role } = useNode<LocalDatabaseNode>();

  if (!node || node.type !== 'database') {
    return <DatabaseNotFound />;
  }

  return (
    <Database database={node} role={role}>
      <DatabaseViews
        inline={inline}
        renderLayout={({ view, inline: isInline }) => (
          <MobileLayout view={view} inline={isInline} />
        )}
      />
    </Database>
  );
};
