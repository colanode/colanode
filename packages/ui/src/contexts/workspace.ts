import { createContext, useContext } from 'react';

import { Workspace } from '@colanode/client/types';

export const WorkspaceContext = createContext<Workspace>({} as Workspace);

export const useWorkspace = () => useContext(WorkspaceContext);
