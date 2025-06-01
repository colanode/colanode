import { createContext, useContext } from 'react';

import { LocalFileNode } from '@colanode/client/types';

interface FolderContext {
  id: string;
  name: string;
  files: LocalFileNode[];
  onClick: (event: React.MouseEvent<HTMLElement>, id: string) => void;
  onDoubleClick: (event: React.MouseEvent<HTMLElement>, id: string) => void;
  onMove: (nodeId: string, targetId: string) => void;
}

export const FolderContext = createContext<FolderContext>({} as FolderContext);

export const useFolder = () => useContext(FolderContext);
