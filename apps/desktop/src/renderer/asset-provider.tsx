import React from 'react';
import { AssetContext } from '@colanode/ui';

export const AssetProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <AssetContext.Provider
      value={{
        emojiComponent: 'img',
        getEmojiUrl: (id: string) => {
          return `asset://emojis/${id}`;
        },
        iconComponent: 'img',
        getIconUrl: (id: string) => {
          return `asset://icons/${id}`;
        },
        getAvatarUrl: (accountId: string, avatar: string) => {
          return `avatar://${accountId}/${avatar}`;
        },
        getFontUrl: (font: string) => {
          return `asset://fonts/${font}.otf`;
        },
      }}
    >
      {children}
    </AssetContext.Provider>
  );
};
