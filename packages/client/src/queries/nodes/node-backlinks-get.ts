import { LocalNode } from '@colanode/client/types/nodes';

export type NodeBacklinkItem = {
    source: LocalNode;
    parent: LocalNode | null;
    count: number;
};

export type NodeBacklinksGetQueryInput = {
    type: 'node.backlinks.get';
    userId: string;
    nodeId: string;
};

declare module '@colanode/client/queries' {
    interface QueryMap {
        'node.backlinks.get': {
            input: NodeBacklinksGetQueryInput;
            output: NodeBacklinkItem[];
        };
    }
}
