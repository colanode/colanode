import { hashCode, IdType } from '@colanode/core';

export const getAvatarSizeClasses = (size?: string) => {
  if (size === 'small') {
    return 'size-5';
  }
  if (size === 'medium') {
    return 'size-9';
  }
  if (size === 'large') {
    return 'w-12 h-12';
  }
  if (size === 'extra-large') {
    return 'size-16';
  }

  return 'size-9';
};

const colors = [
  'rgb(248 113 113)',
  'rgb(74 222 128)',
  'rgb(96 165 250)',
  'rgb(251 146 60)',
  'rgb(244 114 182)',
  'rgb(250 204 21)',
  'rgb(129 140 248)',
  'rgb(192 132 252)',
  'rgb(45 212 191)',
  'rgb(156 163 175)',
];

export const getColorForId = (id: string) => {
  const index = Math.abs(hashCode(id)) % colors.length;
  return colors[index];
};

export const getAvatarUrl = (accountId: string, avatar: string): string => {
  return `avatar://${accountId}/${avatar}`;
};

export const getDefaultNodeAvatar = (type: IdType): string | null => {
  if (type === IdType.Channel) {
    return '01je8md2pbpk5rdesmb1d54s1tic';
  }

  if (type === IdType.Page) {
    return '01je8md2q765zkjskwmqm17jrtic';
  }

  if (type === IdType.Database) {
    return '01je8md2q0qm5h2dgwhv6sk6kaic';
  }

  if (type === IdType.Record) {
    return '01je8md2q8d8p8yaq4rpybhktqic';
  }

  if (type === IdType.Folder) {
    return '01je8md2qfbtd5hxzsvkhbmbpfic';
  }

  if (type === IdType.Space) {
    return '01je8md2tezbkwrjm9eht228j6ic';
  }

  return null;
};
