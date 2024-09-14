import React from 'react';
import { match } from 'ts-pattern';
import { useParams } from 'react-router-dom';
import { NodeTypes } from '@/lib/constants';
import { PageContainerNode } from '@/components/pages/page-container-node';
import { ChannelContainerNode } from '@/components/channels/channel-container-node';
import { ContainerHeader } from '@/components/workspaces/containers/container-header';
import { Spinner } from '@/components/ui/spinner';
import { mapNode } from '@/lib/nodes';
import { DatabaseContainerNode } from '@/components/databases/database-container-node';
import { useNodeQuery } from '@/queries/use-node-query';
import { RecordContainerNode } from '@/components/records/record-container-node';

export const Container = () => {
  const { nodeId } = useParams<{ nodeId: string }>();
  const { data, isPending } = useNodeQuery(nodeId);

  if (isPending) {
    return <Spinner />;
  }

  if (!data || data.rows.length === 0) {
    return null;
  }

  const node = mapNode(data.rows[0]);
  return (
    <div className="flex h-full w-full flex-col">
      <ContainerHeader node={node} />
      {match(node.type)
        .with(NodeTypes.Channel, () => <ChannelContainerNode node={node} />)
        .with(NodeTypes.Page, () => <PageContainerNode node={node} />)
        .with(NodeTypes.Database, () => <DatabaseContainerNode node={node} />)
        .with(NodeTypes.Record, () => <RecordContainerNode node={node} />)
        .otherwise(() => null)}
    </div>
  );
};