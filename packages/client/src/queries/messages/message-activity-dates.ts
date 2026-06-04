export type MessageActivityDatesQueryInput = {
    type: 'message.activity-dates';
    userId: string;
    conversationId: string;
};

declare module '@colanode/client/queries' {
    interface QueryMap {
        'message.activity-dates': {
            input: MessageActivityDatesQueryInput;
            output: string[];
        };
    }
}
