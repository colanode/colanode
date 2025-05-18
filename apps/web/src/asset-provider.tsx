import React from 'react';
import { AssetContext } from '@colanode/ui';

export const AssetProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <AssetContext.Provider
      value={{
        emojiComponent: 'svg',
        getEmojiUrl: (id: string) => {
          return `/assets/emojis.svg#${id}`;
        },
        iconComponent: 'svg',
        getIconUrl: (id: string) => {
          return `/assets/icons.svg#${id}`;
        },
        getAvatarUrl: (accountId: string, avatar: string) => {
          return `/assets/avatars/${accountId}/${avatar}`;
        },
        getFontUrl: (font: string) => {
          return `/assets/fonts/${font}.otf`;
        },
      }}
    >
      {children}
    </AssetContext.Provider>
  );
};
