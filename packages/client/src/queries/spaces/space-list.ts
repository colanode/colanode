import { LocalSpaceNode } from '@colanode/client/types/nodes';

export type SpaceListQueryInput = {
  type: 'space_list';
  page: number;
  count: number;
  accountId: string;
  workspaceId: string;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    space_list: {
      input: SpaceListQueryInput;
      output: LocalSpaceNode[];
    };
  }
}
