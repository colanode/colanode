import { ContainerContext } from '@/renderer/contexts/container';
import { NodeContainer } from '@/renderer/components/layouts/node-container';

interface LayoutMainProps {
  nodeId: string;
}

export const LayoutMain = ({ nodeId }: LayoutMainProps) => {
  return (
    <ContainerContext.Provider value={{ nodeId, mode: 'main' }}>
      <NodeContainer nodeId={nodeId} />
    </ContainerContext.Provider>
  );
};