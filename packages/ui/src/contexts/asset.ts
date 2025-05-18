import { createContext, useContext } from 'react';

interface AssetContext {
  getEmojiUrl: (id: string) => string;
  getIconUrl: (id: string) => string;
  getAvatarUrl: (accountId: string, avatar: string) => string;
  getFontUrl: (font: string) => string;
}

export const AssetContext = createContext<AssetContext>({} as AssetContext);

export const useAsset = () => useContext(AssetContext);
