export type Mention = {
  id: string;
  target: string;
  targetType?: string;
};

export const MentionConstants = {
  Everyone: 'everyone',
};
