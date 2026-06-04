export type MentionTargetType =
    | 'user'
    | 'group'
    | 'channel'
    | 'page'
    | 'record'
    | 'database'
    | 'chat'
    | 'space'
    | 'folder'
    | 'file';

export type MentionSearchItem = {
    id: string;
    type: MentionTargetType;
    name: string;
    subtitle?: string | null;
    avatar?: string | null;
};
