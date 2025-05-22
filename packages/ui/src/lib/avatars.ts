import { hashCode, IdType } from '@colanode/core';
import { defaultIcons } from '@colanode/ui/lib/assets';

export type AvatarSize = 'small' | 'medium' | 'large' | 'extra-large';

export interface AvatarProps {
  id: string;
  name?: string | null;
  avatar?: string | null;
  size?: AvatarSize;
  className?: string;
}

export const getAvatarSizeClasses = (size?: AvatarSize) => {
  if (size === 'small') {
    return 'size-5';
  }
  if (size === 'medium') {
    return 'size-9';
  }
  if (size === 'large') {
    return 'size-12';
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

export const getDefaultNodeAvatar = (type: IdType): string | null => {
  if (type === IdType.Channel) {
    return defaultIcons.chat;
  }

  if (type === IdType.Page) {
    return defaultIcons.book;
  }

  if (type === IdType.Database) {
    return defaultIcons.database;
  }

  if (type === IdType.Record) {
    return defaultIcons.bookmark;
  }

  if (type === IdType.Folder) {
    return defaultIcons.folder;
  }

  if (type === IdType.Space) {
    return defaultIcons.apps;
  }

  return null;
};
