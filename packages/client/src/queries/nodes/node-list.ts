import { ParsedOrderBy, SimpleComparison } from '@tanstack/db';

import { LocalNode } from '@colanode/client/types/nodes';

export type NodeListQueryInput = {
  type: 'node.list';
  userId: string;
  filters: Array<SimpleComparison>;
  sorts: Array<ParsedOrderBy>;
  limit?: number;
};

declare module '@colanode/client/queries' {
  interface QueryMap {
    'node.list': {
      input: NodeListQueryInput;
      output: LocalNode[];
    };
  }
}
