import { MentionSearchItem } from '@colanode/client/types/mentions';

export type MentionSearchQueryInput = {
    type: 'mention.search';
    userId: string;
    searchQuery: string;
    limit?: number;
};

declare module '@colanode/client/queries' {
    interface QueryMap {
        'mention.search': {
            input: MentionSearchQueryInput;
            output: MentionSearchItem[];
        };
    }
}
