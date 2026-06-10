import { TagAttributes } from '@colanode/core';

export type WorkspaceTagsUpdateMutationInput = {
  type: 'workspace.tags.update';
  userId: string;
  tags: Record<string, TagAttributes>;
};

export type WorkspaceTagsUpdateMutationOutput = {
  success: boolean;
};

declare module '@colanode/client/mutations' {
  interface MutationMap {
    'workspace.tags.update': {
      input: WorkspaceTagsUpdateMutationInput;
      output: WorkspaceTagsUpdateMutationOutput;
    };
  }
}
