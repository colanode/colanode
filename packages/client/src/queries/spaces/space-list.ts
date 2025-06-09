import { LocalSpaceNode } from '@colanode/client/types/nodes';

export type SpaceListQueryInput = {
  type: 'space.list';
  page: number;
  count: number;
  accountId: string;
  workspaceId: string;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'space.list': {
      input: SpaceListQueryInput;
      output: LocalSpaceNode[];
    };
  }
}
