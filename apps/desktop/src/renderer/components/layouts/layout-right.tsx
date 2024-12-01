import { NodeContainer } from '@/renderer/components/layouts/node-container';
import { ContainerContext } from '@/renderer/contexts/container';

interface LayoutRightProps {
  nodeId: string;
}

export const LayoutRight = ({ nodeId }: LayoutRightProps) => {
  return (
    <ContainerContext.Provider value={{ nodeId, mode: 'panel' }}>
      <NodeContainer nodeId={nodeId} />
    </ContainerContext.Provider>
  );
};
