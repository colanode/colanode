import { MentionSearchItem, MentionTargetType } from '@colanode/client/types/mentions';

export type MentionSearchQueryInput = {
    type: 'mention.search';
    userId: string;
    searchQuery: string;
    limit?: number;
    allowedTypes?: MentionTargetType[];
};

declare module '@colanode/client/queries' {
    interface QueryMap {
        'mention.search': {
            input: MentionSearchQueryInput;
            output: MentionSearchItem[];
        };
    }
}
