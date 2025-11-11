import { LocalFileNode } from '@colanode/client/types';
import { FileBody } from '@colanode/ui/components/files/file-body';
import { FileNotFound } from '@colanode/ui/components/files/file-not-found';
import { useNodeContainer } from '@colanode/ui/hooks/use-node-container';
import { useNodeRadar } from '@colanode/ui/hooks/use-node-radar';

interface FileContainerProps {
  fileId: string;
}

export const FileContainer = ({ fileId }: FileContainerProps) => {
  const data = useNodeContainer<LocalFileNode>(fileId);
  useNodeRadar(data.node);

  if (data.isPending) {
    return null;
  }

  if (!data.node) {
    return <FileNotFound />;
  }

  return <FileBody file={data.node} />;
};
