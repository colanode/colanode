import { createContext, useContext } from 'react';
import { Workspace } from '@/shared/types/workspaces';

interface WorkspaceContext extends Workspace {
  openInMain: (nodeId: string) => void;
  isNodeActive: (nodeId: string) => boolean;
  openInModal: (nodeId: string) => void;
  isModalActive: (nodeId: string) => boolean;
  closeModal: () => void;
  closeMain: () => void;
  closeNode: (nodeId: string) => void;
  openSettings: () => void;
}

export const WorkspaceContext = createContext<WorkspaceContext>(
  {} as WorkspaceContext
);

export const useWorkspace = () => useContext(WorkspaceContext);
