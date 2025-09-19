import { createContext, useContext } from 'react';

import {
  WorkspaceMetadataKey,
  WorkspaceMetadataMap,
} from '@colanode/client/types';

interface WorkspaceMetadataContext {
  get: <K extends WorkspaceMetadataKey>(
    key: K
  ) => WorkspaceMetadataMap[K] | undefined;
  set: <K extends WorkspaceMetadataKey>(
    key: K,
    value: WorkspaceMetadataMap[K]['value']
  ) => void;
  delete: <K extends WorkspaceMetadataKey>(key: K) => void;
}

export const WorkspaceMetadataContext = createContext<WorkspaceMetadataContext>(
  {} as WorkspaceMetadataContext
);

export const useWorkspaceMetadata = () => useContext(WorkspaceMetadataContext);
